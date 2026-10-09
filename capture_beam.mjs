import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  try {
    await page.goto('http://localhost:3000/');
    
    // Load example
    await page.click('button:has-text("Use an example")');
    
    // Generate spec
    await page.click('button:has-text("Generate spec")');
    
    // Wait a bit to let the animation run and be visible
    await page.waitForTimeout(1000);
    
    // Save screenshot
    await page.screenshot({ path: 'docs/border-beam-mono.png' });
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
