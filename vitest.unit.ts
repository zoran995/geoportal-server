import { defineConfig, mergeConfig } from 'vitest/config';

import config from './vitest.config.js';

export default mergeConfig(
  config,
  defineConfig({
    test: {
      passWithNoTests: true,
      include: ['src/**/*.spec.ts'],
      coverage: {
        reportsDirectory: 'coverage/unit',
      },
    },
  }),
  true,
);
