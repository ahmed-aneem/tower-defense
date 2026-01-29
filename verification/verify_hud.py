from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000")

    # Wait for the start button and click it
    page.get_by_text("INITIALIZE SYSTEM").click()
    page.wait_for_timeout(1000)

    # 1. Select SNIPER
    # Use exact match or role to click the button
    page.locator("button", has_text="SNIPER").click()
    page.wait_for_timeout(500)

    # 2. Click on map to place (safe spot)
    canvas = page.locator("canvas")
    box = canvas.bounding_box()

    click_x = box['x'] + (500 / 1200) * box['width']
    click_y = box['y'] + (350 / 800) * box['height']

    page.mouse.click(click_x, click_y)
    page.wait_for_timeout(500)

    # 4. Click the placed tower again to select it
    page.mouse.click(click_x, click_y)
    page.wait_for_timeout(500)

    # 5. Verify Info
    # Check for "Camo Detect" which is unique to the info panel
    expect(page.get_by_text("Camo Detect")).to_be_visible()
    expect(page.get_by_text("ACTIVE")).to_be_visible()

    # Check Speed button
    expect(page.get_by_text("1x")).to_be_visible()

    # Take screenshot
    page.screenshot(path="verification/hud_verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
