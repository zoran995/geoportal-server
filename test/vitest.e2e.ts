import { defineConfig, mergeConfig } from 'vitest/config';

import config from '../vitest.config.js';

export default mergeConfig(
  config,
  defineConfig({
    test: {
      passWithNoTests: true,
      include: ['./**/*.e2e-spec.ts'],
      retry: 1,
    },
  }),
  true,
);
