/* eslint-disable @typescript-eslint/no-require-imports */
const envalid = require('envalid');

envalid.cleanEnv(process.env, {
  NEXT_PUBLIC_APP_NAME: envalid.str(),
  NEXT_PUBLIC_API_URL: envalid.str(),
});

module.exports = {
  output: 'standalone',
  images: {
    // The image optimizer (/_next/image) has unpatched RCE/SSRF advisories in Next 16.2.x
    // (GHSA-2xp9, GHSA-2464, GHSA-cjq9; fixed in >=16.4.1). Nothing here uses next/image, so
    // disable it. Re-enable once Next can be upgraded.
    unoptimized: true,
    remotePatterns: process.env.DOMAIN_NAME ? [{ protocol: 'https', hostname: process.env.DOMAIN_NAME }] : [],
    formats: ['image/avif', 'image/webp'],
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  experimental: {
    optimizePackageImports: ['@sk-web-gui/core', '@sk-web-gui/react', 'lodash', 'dayjs'],
  },
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [{ source: '/napi/:path*', destination: '/api/:path*' }];
  },
};
