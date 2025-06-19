// eslint.config.js
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const prettierConfig = require('eslint-config-prettier');
const prettier = require('eslint-plugin-prettier');

module.exports = [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/protobuf/**',
      '**/generated/**',
      '**/*.lock',
      '**/pnpm-lock.yaml',
      '**/.git/**',
      '**/.husky/**',
      '**/*.proto',
      '**/*.pb.ts',
      '**/*.pb.js',
      '**/*.config.js',
      '**/*.config.mjs',
    ],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptParser,
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier: prettier,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      ...prettierConfig.rules,
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
];
