import { timingSafeEqual } from 'node:crypto';

import { cleanEnv, makeExactValidator, makeValidator, str } from 'envalid';

const DEFAULT_REQUEST_TIMEOUT_MS = 3_000;
const MAX_REQUEST_TIMEOUT_MS = 30_000;

interface HealthConfig {
  readonly authentication:
    | Readonly<{ enabled: false }>
    | Readonly<{
        enabled: true;
        expectedAuthorization: string;
      }>;
  readonly backendHealthUrl: string;
  readonly requestTimeoutMs: number;
}

type Environment = Readonly<Record<string, string | undefined>>;

const strictBoolean = makeExactValidator<boolean>((rawValue) => {
  if (rawValue !== 'true' && rawValue !== 'false') {
    throw new Error('HEALTH_AUTH must be either "true" or "false"');
  }

  return rawValue === 'true';
});

const backendHealthUrl = makeValidator<string>((rawValue) => {
  const internalApiUrl = rawValue.trim();

  if (!internalApiUrl) {
    throw new Error('INTERNAL_API_URL is required');
  }

  const baseUrl = new URL(internalApiUrl.endsWith('/') ? internalApiUrl : `${internalApiUrl}/`);

  if (baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') {
    throw new Error('INTERNAL_API_URL must use http or https');
  }

  return new URL('health/up', baseUrl).toString();
});

const requestTimeout = makeValidator<number>((rawValue) => {
  if (rawValue === '') {
    return DEFAULT_REQUEST_TIMEOUT_MS;
  }

  const timeout = Number(rawValue);

  if (!/^\d+$/.test(rawValue) || !Number.isInteger(timeout) || timeout < 1 || timeout > MAX_REQUEST_TIMEOUT_MS) {
    throw new Error(`HEALTH_REQUEST_TIMEOUT_MS must be an integer between 1 and ${MAX_REQUEST_TIMEOUT_MS}`);
  }

  return timeout;
});

const environmentSpec = {
  HEALTH_AUTH: strictBoolean({ default: false }),
  HEALTH_PASSWORD: str({ default: '' }),
  HEALTH_REQUEST_TIMEOUT_MS: requestTimeout({ default: DEFAULT_REQUEST_TIMEOUT_MS }),
  HEALTH_USERNAME: str({ default: '' }),
  INTERNAL_API_URL: backendHealthUrl({ desc: 'INTERNAL_API_URL is required' }),
};

export const createHealthConfig = (environment: Environment): HealthConfig => {
  const validatedEnvironment = cleanEnv(environment, environmentSpec, { reporter: null });
  const { HEALTH_AUTH, HEALTH_PASSWORD, HEALTH_USERNAME } = validatedEnvironment;

  if (!HEALTH_AUTH) {
    return {
      authentication: { enabled: false },
      backendHealthUrl: validatedEnvironment.INTERNAL_API_URL,
      requestTimeoutMs: validatedEnvironment.HEALTH_REQUEST_TIMEOUT_MS,
    };
  }

  if (!HEALTH_USERNAME || !HEALTH_PASSWORD) {
    throw new Error('HEALTH_USERNAME and HEALTH_PASSWORD are required when HEALTH_AUTH is true');
  }

  const credentials = Buffer.from(`${HEALTH_USERNAME}:${HEALTH_PASSWORD}`).toString('base64');

  return {
    authentication: { enabled: true, expectedAuthorization: `Basic ${credentials}` },
    backendHealthUrl: validatedEnvironment.INTERNAL_API_URL,
    requestTimeoutMs: validatedEnvironment.HEALTH_REQUEST_TIMEOUT_MS,
  };
};

export const isHealthRequestAuthorized = (authorization: string | null, config: HealthConfig): boolean => {
  if (!config.authentication.enabled) {
    return true;
  }

  const suppliedAuthorization = Buffer.from(authorization ?? '');
  const expectedAuthorization = Buffer.from(config.authentication.expectedAuthorization);

  if (suppliedAuthorization.length !== expectedAuthorization.length) {
    return false;
  }

  return timingSafeEqual(suppliedAuthorization, expectedAuthorization);
};
