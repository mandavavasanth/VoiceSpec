import { chromium } from 'playwright';
import fs from 'fs';

async function capture() {
  if (!fs.existsSync('docs/screenshots')) {
    fs.mkdirSync('docs/screenshots', { recursive: true });
  }

  const browser = await chromium.launch();

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900, isMobile: false },
    { name: 'mobile', width: 390, height: 844, isMobile: true },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.isMobile,
      isMobile: viewport.isMobile,
    });
    const page = await context.newPage();

    // IDLE
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      window.localStorage.setItem('force-demo-mode', 'true');
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Wait for animations
    await page.screenshot({ path: `docs/screenshots/${viewport.name}-idle.png` });

    // GENERATING
    await page.getByRole('button', { name: /Use an example/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /Generate spec/i }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `docs/screenshots/${viewport.name}-generating.png` });

    // FINISHED
    await page.waitForSelector('text=Requirements');
    if (viewport.isMobile) {
      const specTab = page.getByRole('tab', { name: /Specification/i });
      if (await specTab.isVisible()) {
        await specTab.click();
      }
    }
    await page.waitForTimeout(1000); // Wait for spec to render and fade in
    await page.screenshot({ path: `docs/screenshots/${viewport.name}-finished.png` });

    await context.close();
  }

  await browser.close();
}

capture().catch(console.error);
