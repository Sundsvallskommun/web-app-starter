export type IsKeyOptional<T extends Record<string | number | symbol | any, unknown>, Keys extends keyof T> =
  { [Key in Keys]?: T[Key] } extends Pick<T, Keys> ? true : false;
