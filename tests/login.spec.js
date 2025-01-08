import { test, expect } from '@playwright/test';

import config from './config/playwrightConfig.mjs';

test.use(config.use);

test('should load the login page', async ({ page }) => {

    await page.goto(`/login`);

    await expect(page).toHaveURL('/login');

});

test(`should login successfully`, async ({ page }) => {

    await page.goto(`/login`);
    
    await page.fill(`input[type="email"]`, `s.navarroredondo@gmail.com`)

    await page.fill(`input[type="password"]`, `123456` );

    await page.click(`button[type="submit"]`);

    await expect(page).toHaveURL(`/user/`);
});

test(`should login successfully WITH random caps in the username`, async ({ page }) => {

    await page.goto(`/login`);
    
    await page.fill(`input[type="email"]`, `s.NavaRRoredOndo@gmail.com`)

    await page.fill(`input[type="password"]`, `123456` );

    await page.click(`button[type="submit"]`);

    await expect(page).toHaveURL(`/user/`);
});

test(`should fail login due to user not existing`, async ({ page }) => {

    await page.goto(`/login`);

    const randomEmail = Math.random().toString(36).substring(7) + `@gmail.com`;

    const randomPassword = Math.random().toString(36).substring(7);

    await page.fill(`input[type="email"]`, randomEmail)
    
    await page.fill(`input[type="password"]`, randomPassword );

    await page.click(`button[type="submit"]`);

    const errorMessage = page.locator(`.errorMessage`)

    await expect(errorMessage).toBeVisible();
    
});


test(`should fail login due to wrong password`, async ({ page }) => {

    await page.goto(`/login`);

    await page.fill(`input[type="email"]`, `s.navarroredondo@com`)
    
    await page.fill(`input[type="password"]`, `wrongpassword` );

    await page.click(`button[type="submit"]`);

    const errorMessage = page.locator(`.errorMessage`)

    await expect(errorMessage).toBeVisible();
    
});

test(`should fail login due to missing email input`, async ({ page }) => {

    await page.goto(`/login`);
    
    await page.fill(`input[type="password"]`, `wrongpassword` );
    
    await page.evaluate(() => {
        document.querySelector('input[type="email"]').removeAttribute('required');
    });

    await page.click(`button[type="submit"]`);


    const errorMessage = page.locator(`.errorMessage`)

    await expect(errorMessage).toBeVisible();

});

test(`should fail login due to missing password`, async ({ page }) => {

    await page.goto(`/login`);

    await page.fill(`input[type="email"]`, `s.navarroredondo@com`)

    await page.evaluate(() => {
        document.querySelector('input[type="password"]').removeAttribute('required');
    });
    
    await page.click(`button[type="submit"]`);

    const errorMessage = page.locator(`.errorMessage`)

    await expect(errorMessage).toBeVisible();
});

test(`should log out successfully`, async ({ page }) => {
    
    await page.goto(`/login`);
    
    await page.fill(`input[type="email"]`, `s.navarroredondo@gmail.com`)

    await page.fill(`input[type="password"]`, `123456` );

    await page.click(`button[type="submit"]`);

    await expect(page).toHaveURL(`/user/`);

    await page.click(`.logoutButton`);

    await expect(page).toHaveURL(`/`);


});

