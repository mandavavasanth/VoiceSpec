import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  
  const capture = async (width, height, name) => {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto('http://localhost:3000');
    
    await page.click('text=Use an example');
    
    // Idle state after click
    await page.waitForTimeout(500);
    await page.screenshot({ path: `screenshots/${name}-idle.png` });
    
    await page.click('text=Generate spec');
    await page.waitForTimeout(500); // Wait for generation to start
    await page.screenshot({ path: `screenshots/${name}-generating.png` });
    
    // Finished state
    try {
      await page.getByText('Requirements').first().waitFor({ timeout: 30000 });
      await page.waitForTimeout(1000); // Let animation settle
    } catch (e) {
      console.log('Timeout waiting for Requirements for', name);
    }
    await page.screenshot({ path: `screenshots/${name}-finished.png` });
    
    await page.close();
  };

  await capture(1440, 900, 'desktop');
  await capture(390, 844, 'mobile');
  
  await browser.close();
})();
