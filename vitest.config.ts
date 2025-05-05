import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    target: 'esnext',
  },
  test: {
    typecheck: {
      enabled: true,
    },
    environment: 'node',
    globals: true,
    root: './',
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        '**/*.module.ts$',
        '**/index.ts',
        '__tests__/**',
      ],
    },
  },
  plugins: [swc.vite()],
});
