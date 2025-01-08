import { test, expect } from '@playwright/test';

import config from './config/playwrightConfig.mjs';

test.use(config.use);

test('should load the registration page', async ({ page }) => { 
    await page.goto(`/register`);
    
    await expect(page).toHaveURL('/register');

});

test(`should register successfully`, async ({ page }) => {

    await page.goto(`/register`);
    
    const randomEmail = `${Math.random()}@gmail.com`;
    
    await page.fill(`input[type="email"]`, randomEmail,);

    await page.fill(`input[type="password"]`, `123456` );

    await page.click(`button[type="submit"]`);

    await expect(page).toHaveURL('/login');
});

test(`should register successfully with random caps in the username`, async ({ page }) => {

    await page.goto(`/register`);
    
    const randomEmail = `asddSSSD${Math.random()}SDDD@gmaSSil.com`;
    
    await page.fill(`input[type="email"]`, randomEmail,);

    await page.fill(`input[type="password"]`, `123456` );

    await page.click(`button[type="submit"]`);

    await expect(page).toHaveURL('/login');
});


test(`should fail registration because user already exists`, async ({ page }) => {
    
    await page.goto(`/register`);

    await page.fill(`input[type="email"]`, `s.navarroredondo@gmail.com` );

    await page.fill(`input[type="password"]`, `123456` );

    await page.click(`button[type="submit"]`);

    const errorMessage = page.locator(`.errorMessage`)

    await expect(errorMessage).toBeVisible();

});


test(`should fail registration because email input is empty`, async ({ page }) => {
    
    await page.goto(`/register`);

    const randomPassword = Math.random() * 1000000000;

    await page.evaluate(() => {
        document.querySelector('input[type="email"]').removeAttribute('required');
    });

    await page.fill(`input[type="password"]`, randomPassword.toString() );

    await page.click(`button[type="submit"]`);

    const errorMessage = page.locator(`.errorMessage`)

    await expect(errorMessage).toBeVisible();

});

test(`should fail registration because password is empty`, async ({ page }) => {
    
    await page.goto(`/register`);

    const randomEmail = `${Math.random()}@gmail.com`;

    await page.fill(`input[type="email"]`, randomEmail );

    await page.evaluate(() => {
        document.querySelector('input[type="password"]').removeAttribute('required');
    });

    await page.click(`button[type="submit"]`);


    const errorMessage = page.locator(`.errorMessage`)

    await expect(errorMessage).toBeVisible();

});


test(`should fail registration because email address rules is not valid`, async ({ page }) => {
    
    

    const invalidEmails = [
        "username@com",

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


    for (const email of invalidEmails) {

        await page.goto(`/register`);
        
        await page.fill(`input[type="email"]`, email );

        await page.fill(`input[type="password"]`, `1234` );

        await page.click(`button[type="submit"]`);

        const errorMessage = page.locator(`.errorMessage`)

        await expect(errorMessage).toBeVisible();
    }

});