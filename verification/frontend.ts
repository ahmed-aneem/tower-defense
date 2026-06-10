import { test, expect, chromium } from '@playwright/test';

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 },
        recordVideo: { dir: 'verification/videos/' }
    });
    const page = await context.newPage();

    await page.goto('http://localhost:5173');

    // Wait for canvas to load
    await page.waitForSelector('canvas');
    await page.waitForTimeout(1000);

    // Click 'INITIALIZE SYSTEM' to start the game
    await page.click('button:has-text("INITIALIZE SYSTEM")');
    await page.waitForTimeout(1000);

    // The game seems to be starting paused, let's unpause if it is.
    try {
        await page.click('button:has-text("RESUME")', { timeout: 1000 });
        await page.waitForTimeout(1000);
    } catch(e) {}

    // Select Basic tower
    await page.click('text=BASIC', { force: true });
    await page.waitForTimeout(500);

    // Update mousepos by moving and clicking canvas
    await page.mouse.move(600, 400);
    await page.mouse.click(600, 400);
    await page.waitForTimeout(500);

    // Confirm placement
    await page.click('button:has-text("X") + button', { force: true });
    await page.waitForTimeout(1000);

    // Select the placed tower
    await page.mouse.click(600, 400);
    await page.waitForTimeout(1000);

    // Upgrade the tower twice to see level 3 UI
    try {
        await page.click('button:has-text("UPGRADE")', { force: true });
        await page.waitForTimeout(500);
        await page.click('button:has-text("UPGRADE")', { force: true });
        await page.waitForTimeout(500);
    } catch(e) {}

    // See the dual paths!
    await page.screenshot({ path: 'verification/screenshot4.png' });
    await page.waitForTimeout(1000);

    await browser.close();
})();
