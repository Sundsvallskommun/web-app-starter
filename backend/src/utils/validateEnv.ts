import { cleanEnv, port, str, url } from 'envalid';

/** The SECRET_KEY shipped in the .env.*.local templates — never valid in a deployed environment. */
const EXAMPLE_SECRET_KEY = '{{RANDOM_VALUE_HERE}}';
const RECOMMENDED_SECRET_KEY_LENGTH = 32;

/**
 * Sessions are signed with SECRET_KEY, so a known or short value lets anyone forge a session
 * cookie. Enforced only when deployed (NODE_ENV=production); local development may keep the
 * template value.
 */
function validateSecretKeyStrength(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const secretKey = (process.env.SECRET_KEY ?? '').trim();

  if (secretKey === EXAMPLE_SECRET_KEY) {
    console.error('\nInsecure SECRET_KEY: it is the value shipped in the env templates. Set a strong, unique secret.\n');
    process.exit(1);
  }

  if (secretKey.length < RECOMMENDED_SECRET_KEY_LENGTH) {
    console.warn(`⚠️  SECRET_KEY is shorter than the recommended ${RECOMMENDED_SECRET_KEY_LENGTH} characters.`);
  }
}

// NOTE: Make sure we got these in ENV
const validateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    SECRET_KEY: str(),
    API_BASE_URL: str(),
    CLIENT_KEY: str(),
    CLIENT_SECRET: str(),
    PORT: port(),
    BASE_URL_PREFIX: str(),
    SAML_CALLBACK_URL: url(),
    SAML_LOGOUT_CALLBACK_URL: url(),
    SAML_FAILURE_REDIRECT: url(),
    SAML_ENTRY_SSO: url(),
    SAML_ISSUER: str(),
    SAML_IDP_PUBLIC_CERT: str(),
    SAML_PRIVATE_KEY: str(),
    SAML_PUBLIC_KEY: str(),
  });

  validateSecretKeyStrength();
};

export default validateEnv;
