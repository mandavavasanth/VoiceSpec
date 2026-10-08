import { chromium } from 'playwright';
import fs from 'fs';

async function takeScreenshots(stepName: string) {
  if (!fs.existsSync('docs')) {
    fs.mkdirSync('docs');
  }

  const browser = await chromium.launch();

  // Desktop
  const contextDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageDesktop = await contextDesktop.newPage();
  await pageDesktop.goto('http://localhost:3000');
  await pageDesktop.evaluate(() => {
    window.localStorage.setItem('force-demo-mode', 'true');
  });
  await pageDesktop.getByRole('button', { name: /Use an example/i }).click();
  await pageDesktop.getByRole('button', { name: /Generate spec/i }).click();
  await pageDesktop.waitForSelector('text=Requirements');
  // Wait a bit for animations
  await pageDesktop.waitForTimeout(1000);
  await pageDesktop.screenshot({ path: `docs/${stepName}-desktop.png` });

  // Mobile
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto('http://localhost:3000');
  await pageMobile.evaluate(() => {
    window.localStorage.setItem('force-demo-mode', 'true');
  });
  await pageMobile.getByRole('button', { name: /Use an example/i }).click();
  await pageMobile.getByRole('button', { name: /Generate spec/i }).click();
  await pageMobile.waitForSelector('text=Requirements');

  // Click spec tab if it exists
  const specTab = pageMobile.getByRole('tab', { name: /Specification/i });
  if (await specTab.isVisible()) {
    await specTab.click();
  }

  await pageMobile.waitForTimeout(1000);
  await pageMobile.screenshot({ path: `docs/${stepName}-mobile.png` });

  await browser.close();
}

takeScreenshots(process.argv[2] || 'step3').catch(console.error);
