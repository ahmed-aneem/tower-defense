from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to app
        page.goto("http://localhost:5173")

        # Check title or text
        expect(page.get_by_text("NEON DEFENSE")).to_be_visible()

        # Click Start
        start_btn = page.get_by_text("INITIALIZE SYSTEM")
        start_btn.click()

        # Wait for Game UI (HUD)
        expect(page.get_by_text("WAVE 1")).to_be_visible()

        # Wait a bit for enemies to spawn (spawn timer is 60 ticks = 1 sec)
        page.wait_for_timeout(2000)

        # Take screenshot
        page.screenshot(path="verification/screenshot.png")

        browser.close()

if __name__ == "__main__":
    run()
