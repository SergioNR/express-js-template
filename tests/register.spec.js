import { test, expect } from '@playwright/test';

import config from './config/playwrightConfig.mjs';

test.use(config.use);

test('should load the registration page', async ({ page }) => {
  await page.goto('/register');

  await expect(page).toHaveURL('/register');
});

test('should register successfully', async ({ page }) => {
  await page.goto('/register');

  const randomEmail = `${Math.random()}@gmail.com`;

  await page.fill('input[type="email"]', randomEmail);

  await page.fill('input[type="password"]', '123456');

  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/login');
});

test('should register successfully with random caps in the username', async ({ page }) => {
  await page.goto('/register');

  const randomEmail = `asddSSSD${Math.random()}SDDD@gmaSSil.com`;

  await page.fill('input[type="email"]', randomEmail);

  await page.fill('input[type="password"]', '123456');

  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/login');
});

test('should fail registration because user already exists', async ({ page }) => {
  await page.goto('/register');

  await page.fill('input[type="email"]', 's.navarroredondo@gmail.com');

  await page.fill('input[type="password"]', '123456');

  await page.click('button[type="submit"]');

  const errorMessage = page.locator('.errorMessage');

  await expect(errorMessage).toBeVisible();
});

test('should fail registration because email input is empty', async ({ page }) => {
  await page.goto('/register');

  const randomPassword = Math.random() * 1000000000;

  await page.evaluate(() => {
    document.querySelector('input[type="email"]').removeAttribute('required');
  });

  await page.fill('input[type="password"]', randomPassword.toString());

  await page.click('button[type="submit"]');

  const errorMessage = page.locator('.errorMessage');

  await expect(errorMessage).toBeVisible();
});

test('should fail registration because password is empty', async ({ page }) => {
  await page.goto('/register');

  const randomEmail = `${Math.random()}@gmail.com`;

  await page.fill('input[type="email"]', randomEmail);

  await page.evaluate(() => {
    document.querySelector('input[type="password"]').removeAttribute('required');
  });

  await page.click('button[type="submit"]');

  const errorMessage = page.locator('.errorMessage');

  await expect(errorMessage).toBeVisible();
});

test('should fail registration because email address rules is not valid', async ({ page }) => {
  const invalidEmails = [
    'username@com',
    //* invalid email addresses Below are already being checked by the browser with <input="email">
    // "plainaddress",
    // "@missingusername.com",
    // "username@.com",
    // "username@domain..com",
    // "username@domain,com",
    // "username@domain@domain.com",
    // "username@domain.com (Joe Smith)",
    // "username@domain..com",
    // "username@domain.com."
  ];

  for (const invalidEmail of invalidEmails) {
    await page.goto('/register', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', invalidEmail);
    await page.fill('input[type="password"]', '1234');
    await page.click('button[type="submit"]');

    const errorMessage = page.locator('.errorMessage');
    await expect(errorMessage).toBeVisible();
  }
});

test('should fail registration because email domain is blocked', async ({ page }) => {
  const blockedDomains = [
    'randomEmail@tempmail.com',
    'randomEmail@throwaway.com',
  ];

  for (const blockedDomain of blockedDomains) {
    await page.goto('/register');
    await page.fill('input[type="email"]', blockedDomain);
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    const errorMessage = page.locator('.errorMessage');
    await expect(errorMessage).toBeVisible();
  }
});

test('should normalize gmail addresses correctly', async ({ page }) => {
  const emailVariations = [
    `test.user${Math.random()}@gmail.com`, // with dots
    `test${Math.random()}+label@gmail.com`, // with label
    `testuser2${Math.random()}@googlemail.com`, // googlemail domain
  ];

  // Test each email variation sequentially
  for (const denormalizedEmail of emailVariations) {
    await page.goto('/register');
    await page.fill('input[type="email"]', denormalizedEmail);
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    // Should redirect to login page since it's treated as the same email
    await expect(page).toHaveURL('/login');
  }
});

test('should fail registration with password length violations', async ({ page }) => {
  const invalidPasswords = [
    '12345', // too short (min 6)
    'a'.repeat(33), // too long (max 32)
  ];

  for (const password of invalidPasswords) {
    await page.goto('/register');
    await page.fill('input[type="email"]', `test${Math.random()}@gmail.com`);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    const errorMessage = page.locator('.errorMessage');
    await expect(errorMessage).toBeVisible();
  }
});

test('should trim and escape password properly', async ({ page }) => {
  await page.goto('/register');

  const email = `test${Math.random()}@gmail.com`;
  const passwordWithSpaces = '  123456  ';

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', passwordWithSpaces);
  await page.click('button[type="submit"]');

  // Should successfully register since spaces are trimmed
  await expect(page).toHaveURL('/login');
});
