import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vite 8 transforms with Oxc by default, which (like esbuild) does not emit
  // `emitDecoratorMetadata`. unplugin-swc sets `esbuild: false`, but that no longer
  // disables the default transform, so disable Oxc explicitly and let SWC (below) own it.
  oxc: false,
  esbuild: false,
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    // routing-controllers / class-validator depend on `emitDecoratorMetadata`, which esbuild
    // (Vitest's default transform) does not emit. SWC does, so we transform with it instead.
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: 'es2022',
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/data-contracts/**', 'src/**/*.{test,spec}.ts', 'src/types/**', 'src/swagger-typescript-api.ts'],
      thresholds: {
        'src/controllers/health.controller.ts': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
        'src/server.ts': {
          branches: 65,
          functions: 90,
          lines: 80,
          statements: 80,
        },
        'src/services/api-token.service.ts': {
          branches: 85,
          functions: 100,
          lines: 90,
          statements: 90,
        },
        'src/utils/redis.ts': {
          branches: 70,
          functions: 75,
          lines: 90,
          statements: 85,
        },
        'src/utils/session-store.ts': {
          branches: 75,
          functions: 100,
          lines: 90,
          statements: 90,
        },
      },
    },
  },
});
