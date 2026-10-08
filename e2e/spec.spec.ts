import { test, expect } from '@playwright/test';

test.describe('VoiceSpec E2E', () => {
  test('Demo mode path generates spec and highlights', async ({ page }) => {
    await page.goto('/');

    // Example, generate, check Demo badge and spec appears
    await page.click('text=Use an example');
    await page.click('text=Generate spec');

    // Demo badge should appear (might be DEMO uppercase from css, but text is Demo)
    await expect(page.getByText('Demo', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('section[aria-label="Specification Pane"]')).toBeVisible();

    // Hover a requirement and check sentences are highlighted
    // Wait for the requirement FR-001 (or similar) to exist
    const req = page.locator('text=FR-001').first();
    await expect(req).toBeVisible();
    await req.hover();

    // Check that sentences are highlighted. The transcript sentences have ID sentence-X
    const highlightedSentence = page.locator('[id^="sentence-"].bg-marker').first();
    await expect(highlightedSentence).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Click Export then Copy Markdown and check for toast
    await page.click('text=Export');
    await page.click('text=Copy Markdown');
    await expect(page.locator('text=Markdown copied to clipboard')).toBeVisible();

    // Click Copy agent prompt button and check for toast
    await page.click('text=Copy agent prompt');
    await expect(page.locator('text=Agent prompt copied to clipboard')).toBeVisible();
  });

  test('Happy path with accessible navigation', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.click('text=Use an example');
    await page.click('text=Generate spec');
    await expect(page.getByText('Demo', { exact: true })).toBeVisible({ timeout: 10000 });

    if (isMobile) {
      // Should have switched to spec tab
      await expect(page.locator('section[aria-label="Specification Pane"]')).toBeVisible();
    }
  });
});

test.describe('Accessibility and Responsive', () => {
  test.use({ reducedMotion: 'reduce' });

  test('Revealed items are visible immediately with reduced motion', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Use an example');
    await page.click('text=Generate spec');

    // Wait for the spec pane to appear
    await expect(page.locator('section[aria-label="Specification Pane"]')).toBeVisible({
      timeout: 10000,
    });

    const req = page.locator('text=FR-001').first();
    await expect(req).toBeVisible();

    // Check computed style for animation duration
    const opacity = await req.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeGreaterThan(0.9);
  });
});

test.describe('Mobile Viewport (360px)', () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test('No horizontal scroll at 360px width', async ({ page }) => {
    await page.goto('/');

    // Check if horizontal scroll exists on body or main document
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });
});
