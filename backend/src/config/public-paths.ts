/**
 * Non-controller Express mounts reachable without authentication.
 *
 * Keep this list minimal - prefix matching grants a whole subtree.
 */
const PUBLIC_PATH_PREFIXES: readonly string[] = ['/api-docs', '/swagger.json'];

/** Strips a single trailing slash so '/health/up/' matches '/health/up'. Keeps a bare '/'. */
const normalizePath = (path: string): string => (path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path);

/**
 * True when the path may be served without an authenticated session.
 *
 * `publicPaths` is an exact-match set built from @Public() decorators at startup.
 * PUBLIC_PATH_PREFIXES opts in to subtree matching, only on a segment boundary -
 * '/api-docs' must not match '/api-docsomething'.
 */
export const isPublicPath = (path: string, publicPaths: Set<string>): boolean => {
  const normalized = normalizePath(path);

  if (publicPaths.has(normalized)) {
    return true;
  }

  return PUBLIC_PATH_PREFIXES.some(prefix => normalized === prefix || normalized.startsWith(`${prefix}/`));
};
