module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: 'airbnb-base',
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
      files: ['*.spec.js'],
      rules: {
        'no-await-in-loop': 'off', // Disable the rule for await inside loops in spec files
        'no-restricted-syntax': 'off',
        'consistent-return': 'off',
      },
    },
    {
      files: ['*Scheduler.mjs'],
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
  },
};
