import { test, expect } from '@playwright/test';
import { checkNavbarAndFooter } from './utils/sitewideUtils';

import config from './config/playwrightConfig.mjs';

test.use(config.use);

test('should load the login page', async ({ page }) => {

    await page.goto(`/login`);

    await expect(page).toHaveURL('/login');

});

test(`should login successfully`, async ({ page }) => {

    await page.goto(`/login`);
    
    await page.fill(`input[type="email"]`, `s.navarroredondo@gmail.com`)

    await page.fill(`input[type="password"]`, `1234` );

    await page.click(`button[type="submit"]`);

    await expect(page).toHaveURL(`/user/`);
});

test(`should fail login`, async ({ page }) => {

    await page.goto(`/login`);

    await page.fill(`input[type="email"]`, `s.navarroredondo@com`)
    
    await page.fill(`input[type="password"]`, `wrongpassword` );

    await page.click(`button[type="submit"]`);

    await expect(page).toHaveURL(`/failed-login`);
});




