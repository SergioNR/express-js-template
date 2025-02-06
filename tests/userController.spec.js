import { test, expect } from '@playwright/test';

import config from './config/playwrightConfig.mjs';

test.use(config.use);

test('userApi.get("/") returns a list of all users', async ({ request }) => {
  // Send a GET request to the endpoint
  const response = await request.get('/api/v1/user'); // Correct endpoint for getting all users

  // Check if the response status is 200
  expect(response.status()).toBe(200);

  // Parse the response body
  const responseBody = await response.json();

  // Validate the structure of the response
  expect(responseBody).toHaveProperty('success', true);
  expect(responseBody).toHaveProperty('userCount');
  expect(responseBody).toHaveProperty('users');
  expect(Array.isArray(responseBody.users)).toBe(true); // Ensure 'users' is an array

  // Optionally, check if the userCount matches the length of the users array
  expect(responseBody.userCount).toBe(responseBody.users.length);
});

test('userApi.get("/:userId") returns one user', async ({ request }) => {
  const requestData = {
    username: `${Math.random()}@gmail.com`,
    password: '123456',
  };

  const userCreationResponse = await request.post('/auth/register/', {
    data: requestData,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  expect(userCreationResponse.status()).toBe(201);
  const userCreationResponseBody = await userCreationResponse.json();

  const existingUserId = userCreationResponseBody.userId;

  const response = await request.get(`/api/v1/user/${existingUserId}`);

  const responseBody = await response.json();

  expect(responseBody).toHaveProperty('success', true);
  expect(responseBody).toHaveProperty('user');
});

test('userApi.get("/:userId") with invented ID returns proper error handling', async ({ request }) => {
  // Use a fake user ID that does not exist
  const fakeUserId = 'fakeId'; // This should be a format that your application expects

  const response = await request.get(`/api/v1/user/${fakeUserId}`); // Use the fake user ID in the URL

  // Check if the response status is 400
  expect(response.status()).toBe(400);

  const responseBody = await response.json();

  // Validate the response structure
  expect(responseBody).toHaveProperty('success', false);
  expect(responseBody).toHaveProperty('message', 'User not found'); // Adjust this based on your actual error message
});

test('userApi.delete("/:userId") deletes one existing user', async ({ request }) => {
  const requestData = {
    username: `${Math.random()}@gmail.com`,
    password: '123456',
  };

  const userCreationResponse = await request.post('/auth/register/', {
    data: requestData,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  expect(userCreationResponse.status()).toBe(201);
  const userCreationResponseBody = await userCreationResponse.json();

  const existingUserId = userCreationResponseBody.userId;

  const response = await request.delete(`/api/v1/user/${existingUserId}`);

  expect(response.status()).toBe(200);

  const responseBody = await response.json();

  expect(responseBody).toHaveProperty('success', true);
  expect(responseBody).toHaveProperty('message');
});

test('userApi.delete("/:userId") fails because user doesnt exist ', async ({ request }) => {
  // TODO - Should create the user and using the createdId user in this function

  const existingUserId = '9b1bf1e8-8c8d-49cb-b42e-38c09694ce7c';

  const response = await request.delete(`/api/v1/user/${existingUserId}`);

  expect(response.status()).toBe(502);

  const responseBody = await response.json();

  expect(responseBody).toHaveProperty('success', false);
  expect(responseBody).toHaveProperty('message');
});
