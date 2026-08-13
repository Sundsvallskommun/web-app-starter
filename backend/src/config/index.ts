import { config } from 'dotenv';

import { APIS } from './api-config';

export { APIS };

// `quiet: true` suppresses dotenv 17's startup banner so it doesn't pollute server logs.
config({ path: `.env.${process.env.NODE_ENV ?? 'development'}.local`, quiet: true });

const env = process.env;

type RedisConfig = { enabled: false } | { enabled: true; host: string; keyPrefix: string; port: number; password?: string };

function parseRedisPort(value: string): number {
  const parsedPort = Number(value);

  if (!/^\d+$/.test(value) || !Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65_535) {
    throw new Error('REDIS_PORT must be an integer between 1 and 65535');
  }

  return parsedPort;
}

export function createRedisConfig(environment: NodeJS.ProcessEnv): RedisConfig {
  const redisHost = environment.REDIS_HOST?.trim() ?? '';
  const redisKeyPrefix = environment.REDIS_KEY_PREFIX?.trim() ?? '';
  const redisPort = environment.REDIS_PORT?.trim() ?? '';
  const redisPassword = environment.REDIS_PASSWORD ?? '';

  if (!redisHost) {
    if (redisPort || redisPassword) {
      throw new Error('REDIS_HOST is required when REDIS_PORT or REDIS_PASSWORD is configured');
    }

    return { enabled: false };
  }

  if (!redisKeyPrefix) {
    throw new Error('REDIS_KEY_PREFIX is required when REDIS_HOST is configured');
  }

  const connection = {
    host: redisHost,
    keyPrefix: redisKeyPrefix,
    port: parseRedisPort(redisPort || '6379'),
  };

  return redisPassword ? { enabled: true, ...connection, password: redisPassword } : { enabled: true, ...connection };
}

export const REDIS_CONFIG = createRedisConfig(env);

/**
 * Session lifetime, shared by the session store TTL and the session cookie's maxAge so the two
 * cannot drift apart. Kept deliberately short — the SAML IdP re-issues a session cheaply.
 */
export const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export const CREDENTIALS = env.CREDENTIALS === 'true';
export const SWAGGER_ENABLED = env.SWAGGER_ENABLED === 'true';

// The values below are required at runtime: validateEnv() (called at startup in server.ts)
// exits the process if any are missing, so typing them as `string` is honest for the rest
// of the codebase. The `?? <default>` fallbacks keep the types non-optional without making
// merely importing this module trigger validation (which would break unit tests).
export const APP_NAME = env.APP_NAME ?? '';
export const NODE_ENV = env.NODE_ENV ?? 'development';
/**
 * Deployment target, independent of NODE_ENV. `LOCAL` means the app is reached over plain
 * http (local `yarn dev` or a locally built production bundle) and the Secure cookie flag
 * must stay off, otherwise the browser drops the session cookie. Leave unset when deployed.
 */
export const ENVIRONMENT = env.ENVIRONMENT ?? '';
export const PORT = env.PORT ?? '';
export const API_BASE_URL = env.API_BASE_URL ?? '';
export const LOG_FORMAT = env.LOG_FORMAT ?? 'dev';
export const LOG_DIR = env.LOG_DIR ?? '../../data/logs';
export const ORIGIN = env.ORIGIN ?? '';
export const SECRET_KEY = env.SECRET_KEY ?? '';
export const CLIENT_KEY = env.CLIENT_KEY ?? '';
export const CLIENT_SECRET = env.CLIENT_SECRET ?? '';
export const BASE_URL_PREFIX = env.BASE_URL_PREFIX ?? '';
export const SAML_CALLBACK_URL = env.SAML_CALLBACK_URL ?? '';
export const SAML_LOGOUT_CALLBACK_URL = env.SAML_LOGOUT_CALLBACK_URL ?? '';
/** @public Optional SAML config, exposed for apps that wire up these flows. */
export const SAML_SUCCESS_BASE = env.SAML_SUCCESS_BASE ?? '';
export const SAML_SUCCESS_REDIRECT = env.SAML_SUCCESS_REDIRECT ?? '';
export const SAML_FAILURE_REDIRECT = env.SAML_FAILURE_REDIRECT ?? '';
/** @public Optional SAML config, exposed for apps that wire up these flows. */
export const SAML_FAILURE_REDIRECT_MESSAGE = env.SAML_FAILURE_REDIRECT_MESSAGE ?? '';
/** @public Optional SAML config, exposed for apps that wire up these flows. */
export const SAML_LOGOUT_REDIRECT = env.SAML_LOGOUT_REDIRECT ?? '';
export const SAML_ENTRY_SSO = env.SAML_ENTRY_SSO ?? '';
/** @public Optional SAML config, exposed for apps that wire up these flows. */
export const SAML_AUDIENCE = env.SAML_AUDIENCE ?? '';
export const SAML_ISSUER = env.SAML_ISSUER ?? '';
export const SAML_IDP_PUBLIC_CERT = env.SAML_IDP_PUBLIC_CERT ?? '';
export const SAML_PRIVATE_KEY = env.SAML_PRIVATE_KEY ?? '';
export const SAML_PUBLIC_KEY = env.SAML_PUBLIC_KEY ?? '';
