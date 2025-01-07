import { test, expect } from '@playwright/test';
import { checkNavbarAndFooter } from './utils/sitewideUtils';

import config from './config/playwrightConfig.mjs';

test.use(config.use);


test.describe(`index.ejs`, () => {
  
  test('should return 200', async ({ page }) => {
    const response = await page.goto(`/`);
    expect(response.status()).toBe(200);
  });

  test('should load a navbar and footer', async ({ page }) => {
    await page.goto(`/`);
    await checkNavbarAndFooter(page);
  });

});

test.describe(`terminos-condiciones.ejs`, () => {
  
  test('should return 200', async ({ page }) => {
    const response = await page.goto(`/terminos-condiciones`);
    expect(response.status()).toBe(200);
  });

  test('should load a navbar and footer', async ({ page }) => {
    await page.goto(`/terminos-condiciones`);
    await checkNavbarAndFooter(page);
  });

});