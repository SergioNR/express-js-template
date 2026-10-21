import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import globals from 'globals';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: ['server/config/generated/**'],
  },
  ...compat.extends('airbnb-base'),
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'import/prefer-default-export': 'off',
      'no-underscore-dangle': 'off',
      'import/extensions': 'off',
      'object-shorthand': 'off',
      'import/no-relative-packages': 'off',
      'no-case-declarations': 'off',
      'max-len': 'off',
      'no-plusplus': 'off',
      'no-await-in-loop': 'off',
      'no-restricted-syntax': 'off',
      'no-return-await': 'off',
    },
  },
  {
    files: ['**/*.spec.js'],
    languageOptions: {
      globals: globals.jest,
    },
    rules: {
      'no-await-in-loop': 'off', // Disable the rule for await inside loops in spec files
      'no-restricted-syntax': 'off',
      'consistent-return': 'off',
    },
  },
  {
    //* Tooling config files run only in development, so importing devDependencies is expected
    files: ['eslint.config.mjs'],
    rules: {
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
  },
  {
    files: ['**/*Scheduler.js'],
    rules: {
      'no-await-in-loop': 'off', // Disable the rule for await inside loops in Scheduler files
      'no-restricted-syntax': 'off',
    },
  },
];
