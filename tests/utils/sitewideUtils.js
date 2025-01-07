import { expect } from '@playwright/test';

export async function checkNavbarAndFooter(page) {
    const navbar = await page.waitForSelector('.navBar');
    expect(navbar).toBeTruthy();

    const footer = await page.waitForSelector('.footer');
    expect(footer).toBeTruthy();
}