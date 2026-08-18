/**
 * Non-controller Express mounts reachable without authentication.
 *
 * Keep this list minimal - prefix matching grants a whole subtree, for every method.
 */
const PUBLIC_PATH_PREFIXES: readonly string[] = ['/api-docs', '/swagger.json'];

/** Strips a single trailing slash so '/health/up/' matches '/health/up'. Keeps a bare '/'. */
const normalizePath = (path: string): string => (path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path);

/** Express answers HEAD from the matching GET handler, so a public GET has to accept HEAD too. */
const normalizeMethod = (httpMethod: string): string => {
  const upper = httpMethod.toUpperCase();
  return upper === 'HEAD' ? 'GET' : upper;
};

/**
 * Key format for the allow-list built by buildPublicPathSet(). Method-scoped on purpose:
 * @Public() sits on a single handler, so marking GET public must not open POST on the
 * same path.
 */
export const publicRouteKey = (httpMethod: string, path: string): string => `${normalizeMethod(httpMethod)} ${normalizePath(path)}`;

/**
 * True when this method/path pair may be served without an authenticated session.
 *
 * `publicPaths` is an exact-match set of 'METHOD /path' keys built from @Public()
 * decorators at startup. PUBLIC_PATH_PREFIXES opts in to subtree matching for every
 * method, only on a segment boundary - '/api-docs' must not match '/api-docsomething'.
 */
export const isPublicPath = (httpMethod: string, path: string, publicPaths: Set<string>): boolean => {
  if (publicPaths.has(publicRouteKey(httpMethod, path))) {
    return true;
  }

  const normalized = normalizePath(path);

  return PUBLIC_PATH_PREFIXES.some(prefix => normalized === prefix || normalized.startsWith(`${prefix}/`));
};
