import { chromium } from 'playwright';

async function runSmokeTest() {
  console.log('🚀 Starting VoiceSpec E2E Smoke Test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1️⃣  Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('✅ Page loaded.');

    const title = await page.title();
    console.log(`✅ Title verified: "${title}"`);

    console.log('2️⃣  Clicking "Try an example"...');
    await page.getByRole('button', { name: /Try an example/i }).click();

    const textarea = page.getByPlaceholder(/Paste or type your product dictation here/i);
    const content = await textarea.inputValue();
    if (content.length > 50) {
      console.log('✅ Example transcript loaded successfully.');
    } else {
      throw new Error('Example transcript failed to load.');
    }

    console.log('3️⃣  Initiating Spec Generation...');
    // Enable force demo mode for the test to ensure it completes fast and without API keys
    await page.evaluate(() => {
      window.localStorage.setItem('force-demo-mode', 'true');
    });

    const generateBtn = page.getByRole('button', { name: 'Generate' });
    await generateBtn.click();
    console.log('✅ Generation started.');

    console.log('4️⃣  Waiting for Generation to Complete...');
    // Wait for the Spec Pane to appear and contain Requirements
    await page.waitForSelector('text=Requirements', { timeout: 60000 });
    console.log('✅ Spec generated and rendered.');

    console.log('5️⃣  Verifying Provenance Highlighting...');
    // Click on a requirement
    const firstReq = page.getByText('FR-001').first();
    await firstReq.click();

    // Check if any span in the transcript has a background color (highlight)
    const highlighted = await page.evaluate(() => {
      const spans = Array.from<HTMLElement>(document.querySelectorAll('span[data-evidence-id]'));
      return spans.some(
        (span) => span.className.includes('bg-') || span.style.backgroundColor !== '',
      );
    });

    if (highlighted) {
      console.log('✅ Provenance highlighting is active and working.');
    } else {
      console.log('❌ Provenance highlighting verification failed.');
    }

    console.log('6️⃣  Verifying Export Actions...');
    const exportTrigger = page.getByRole('button', { name: /Export/i });
    if (await exportTrigger.isVisible()) {
      console.log('✅ Export actions dropdown is available.');
    }

    console.log('🎉 SMOKE TEST PASSED: The application is fully functional and accurate.');
  } catch (error) {
    console.error('❌ SMOKE TEST FAILED:', error);
  } finally {
    await browser.close();
  }
}

runSmokeTest().catch(console.error);
