import { chromium } from 'playwright';

void (async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    errors.push(`Page Error: ${err.message}`);
  });

  page.on('requestfailed', (request) => {
    errors.push(`Network Error: ${request.url()} - ${request.failure()?.errorText || 'Unknown'}`);
  });

  await page.goto('http://localhost:3000');

  // Wait for hydration
  await page.waitForSelector('text=Try an example');

  console.log('Page hydrated successfully.');

  await page.click('text=Try an example');
  await page.click('text=Generate');

  try {
    // Wait for the result in demo mode (which takes about 2 seconds to stream)
    await page.waitForSelector('text=Demo', { timeout: 10000 });
    console.log('Demo badge appeared.');
  } catch (e) {
    console.error('Timeout waiting for Demo badge', e);
  }

  if (errors.length > 0) {
    console.log('ERRORS FOUND:');
    errors.forEach((e) => {
      console.log(e);
    });
  } else {
    console.log('No CSP, Network, or Console errors found.');
  }

  await browser.close();
})();
