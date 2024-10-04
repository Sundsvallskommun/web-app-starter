export const appURL = (): string => {
  return `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH}`;
};
