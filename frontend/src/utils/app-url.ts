export const appURL = (path?: string): string => {
  const {origin} = window.location;

  return path
    ? `${origin}${process.env.NEXT_PUBLIC_BASE_PATH}${path}`
    : `${origin}${process.env.NEXT_PUBLIC_BASE_PATH}`;
};
