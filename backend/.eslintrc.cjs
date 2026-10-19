module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: 'airbnb-base',
  ignorePatterns: ['server/config/generated/**'],
  overrides: [
    {
      env: {
        node: true,
      },
      files: [
        '.eslintrc.{js,cjs}',
      ],
      parserOptions: {
        sourceType: 'script',
      },
    },
    {
      env: {
        jest: true,
      },
      files: ['*.spec.js'],
      rules: {
        'no-await-in-loop': 'off', // Disable the rule for await inside loops in spec files
        'no-restricted-syntax': 'off',
        'consistent-return': 'off',
      },
    },
    {
      files: ['*Scheduler.js'],
      rules: {
        'no-await-in-loop': 'off', // Disable the rule for await inside loops in Scheduler files
        'no-restricted-syntax': 'off',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
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
    'no-return-await': 'off'
  },
};
