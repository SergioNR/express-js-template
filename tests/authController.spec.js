import { test, expect } from '@playwright/test';

import config from './playwrightConfig.mjs';

test.use(config.use);

test('authRouter.post("/register") successfully registers an user', async ({ request }) => {
  const requestData = {
    username: `${Math.random()}@gmail.com`,
    password: '123456',
  };

  const response = await request.post('/auth/register/', {
    data: requestData,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  expect(response.status()).toBe(201);
  const responseBody = await response.json();
  expect(responseBody).toHaveProperty('success', true);
  expect(responseBody).toHaveProperty('userId');
  expect(responseBody).toHaveProperty('message', 'User created successfully');
});

test('useCreation failed due to user already existing', async ({ request }) => {
  const requestData = {
    username: `${Math.random()}@gmail.com`,
    password: '123456',
  };

  await request.post('/auth/register/', {
    data: requestData,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const duplicateResponse = await request.post('/auth/register/', {
    data: requestData,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  expect(duplicateResponse.status()).toBe(400);

  const responseBody = await duplicateResponse.json();
  expect(responseBody).toHaveProperty('success', false);
  expect(responseBody).toHaveProperty('ERR_CODE');
  expect(responseBody).toHaveProperty('message', 'A user with that email address already exists');
});

test('useCreation failed due to schema errors: email validation', async ({ request }) => {
  const invalidUsernames = [
    '',
    'username@com',
    'plainaddress',
    '@missingusername.com',
    'username@.com',
    'username@domain..com',
    'username@domain,com',
    'username@domain@domain.com',
    'username@domain.com (Joe Smith)',
    'username@domain..com',
    'username@domain.com.',
    'username@tempmail.com',
    'username@throwaway.com',
  ];
  const password = '123456';

  for (const invalidUsername of invalidUsernames) {
    const response = await request.post('/auth/register/', {
      data: {
        username: invalidUsername,
        password: password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(400);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('success', false);
    expect(responseBody).toHaveProperty('message');
    expect(responseBody).toHaveProperty('errors');
  }
});

test('useCreation failed due to schema errors: password validation', async ({ request }) => {
  const username = `${Math.random()}@gmail.com`;
  const invalidPasswordArray = [
    ' ', // notEmpty
    123456, // should be a string
    null, // should be a string
    '1234', // min length 6
    '123456789123456789123456789123456', // max length 32
  ];

  for (const password of invalidPasswordArray) {
    const response = await request.post('/auth/register/', {
      data: {
        username: username,
        password: password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(400);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('success', false);
    expect(responseBody).toHaveProperty('message');
    expect(responseBody).toHaveProperty('errors');
  }
});
