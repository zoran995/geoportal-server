import eslint from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import prettierRecommended from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  prettierRecommended,
  {
    ignores: ['**/node_modules/**', 'dist/**'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/unbound-method': [
        'error',
        {
          ignoreStatic: true,
        },
      ],
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
    },
  },
  {
    files: ['**/*.e2e-spec.ts', '**/*.spec.ts'],
    extends: [vitest.configs.recommended],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'vitest/expect-expect': [
        'error',
        {
          assertFunctionNames: [
            'expect',
            'request.**.expect',
            'agent.**.expect',
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.dto.ts'],
    rules: {
      '@typescript-eslint/no-inferrable-types': [
        'error',
        {
          ignoreProperties: true,
        },
      ],
    },
  },
);
