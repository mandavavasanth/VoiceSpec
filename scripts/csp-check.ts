/* eslint-disable */
import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  const res = await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  if (errors.length > 0) {
    console.error('CSP or other errors found:', errors);
    process.exit(1);
  } else {
    console.log('No console errors found. CSP is likely fine.');
  }

  await browser.close();
}

run().catch(console.error);
