import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  try {
    await page.goto('https://voice-spec-two.vercel.app/');
    await page.waitForLoadState('networkidle');
    
    // Check h1 text
    const h1Text = await page.textContent('h1');
    if (!h1Text || !h1Text.includes('Say it messy') || !h1Text.includes('Get a spec you can trace.')) {
      console.log('OLD VERSION: h1 text mismatch. Found:', h1Text);
      process.exit(1);
    }
    
    // Check fonts (Instrument Sans and Newsreader)
    const bodyFont = await page.evaluate(() => window.getComputedStyle(document.body).fontFamily);
    if (!bodyFont.includes('Instrument Sans')) {
      console.log('OLD VERSION: Font mismatch on body. Found:', bodyFont);
      process.exit(1);
    }
    
    // Load example
    await page.click('button:has-text("Use an example")');
    
    // Generate spec
    await page.click('button:has-text("Generate spec")');
    
    // Wait for generation to finish
    await page.waitForSelector('text=Generated in Demo Mode', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.prose', { timeout: 30000 }).catch(() => {});
    
    // Check Export menu
    const exportButton = page.locator('button:has-text("Export")');
    if (!(await exportButton.isVisible())) {
      console.log('OLD VERSION: Export menu not found after generation');
      process.exit(1);
    }
    
    // Save screenshot
    await page.screenshot({ path: 'd:\\WhispFlow\\docs\\production-main.png', fullPage: true });
    
    // Check health route
    const healthResp = await page.request.get('https://voice-spec-two.vercel.app/api/health');
    if (!healthResp.ok()) {
      console.log('OLD VERSION: /api/health returned non-ok status:', healthResp.status());
      process.exit(1);
    }
    const healthJson = await healthResp.json();
    if (healthJson.status !== 'ok') {
      console.log('OLD VERSION: /api/health returned unexpected JSON:', healthJson);
      process.exit(1);
    }
    
    console.log('SUCCESS');
    process.exit(0);
  } catch (err) {
    console.log('ERROR:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
