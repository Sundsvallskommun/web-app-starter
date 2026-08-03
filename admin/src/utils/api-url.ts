export const apiURL = (...parts: string[]): string => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is required');
  }

  const urlParts = [apiBaseUrl, process.env.NEXT_PUBLIC_API_PATH ?? '', ...parts];

  return urlParts
    .map((pathPart) => pathPart.replace(/(^\/|\/$)/g, ''))
    .filter((pathPart) => pathPart.length > 0)
    .join('/');
};
