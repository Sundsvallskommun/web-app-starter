import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vite resolves the `@components/*`, `@services/*`, … aliases from tsconfig; react enables JSX/TSX.
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Unit/component tests live next to the code. Playwright e2e specs live in ./e2e.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/data-contracts/**', 'src/**/*.{test,spec}.{ts,tsx}', 'src/**/*.d.ts'],
      thresholds: {
        'src/config/health-config.ts': {
          branches: 75,
          functions: 100,
          lines: 90,
          statements: 90,
        },
        'src/pages/api/health/up.ts': {
          branches: 70,
          functions: 100,
          lines: 80,
          statements: 80,
        },
        'src/utils/api-url.ts': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
  },
});
