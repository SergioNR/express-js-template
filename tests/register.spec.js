import { test, expect } from '@playwright/test';
import { checkNavbarAndFooter } from './utils/sitewideUtils';

import config from './config/playwrightConfig.mjs';

test.use(config.use);

test('should load the registration page', async ({ page }) => { 
    await page.goto(`/register`);
    
    await expect(page).toHaveURL('/register');

});

test(`should register successfully`, async ({ page }) => {

    await page.goto(`/register`);
    
    const randomEmail = `s.navarroredondo+${Math.random()}@gmail.com`;
    
    await page.fill(`input[type="email"]`, randomEmail,);

    await page.fill(`input[type="password"]`, `1234` );

    await page.click(`button[type="submit"]`);

    // TODO - ADD EXPECTATION -- 
    //? Should be a API response?


});


test(`should fail registration`, async ({ page }) => {
    
    await page.goto(`/register`);

    await page.fill(`input[type="email"]`, `s.navarroredondo@com`)
    await page.fill(`input[type="password"]`, `wrongpassword` );

     // TODO - ADD EXPECTATION -- 
    //? Should be a API response?
});