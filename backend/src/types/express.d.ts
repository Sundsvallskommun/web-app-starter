declare global {
  namespace Express {
    interface User extends Record<string, unknown> {}
  }
}

export {};
