import { test, expect } from '@playwright/test';

test.describe('VoiceSpec E2E', () => {
  test('Demo mode path generates spec and highlights', async ({ page }) => {
    await page.goto('/');

    // Example, generate, check Demo badge and spec appears
    await page.click('text=Try an example');
    await page.click('text=Generate');

    // Demo badge should appear (might be DEMO uppercase from css, but text is Demo)
    await expect(page.getByText('Demo', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('section[aria-label="Specification Pane"]')).toBeVisible();

    // Hover a requirement and check sentences are highlighted
    // Wait for the requirement FR-001 (or similar) to exist
    const req = page.locator('text=FR-001').first();
    await expect(req).toBeVisible();
    await req.hover();

    // Check that sentences are highlighted. The transcript sentences have ID sentence-X
    const highlightedSentence = page.locator('[id^="sentence-"].bg-primary\\/20').first();
    await expect(highlightedSentence).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Click a copy button and check for toast
    await page.click('text=Copy MD');
    await expect(page.locator('text=Markdown copied to clipboard')).toBeVisible();

    // Click Copy Agent Prompt button and check for toast
    await page.click('text=Copy Agent Prompt');
    await expect(page.locator('text=Agent prompt copied to clipboard')).toBeVisible();
  });

  test('Happy path with accessible navigation', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.click('text=Try an example');
    await page.click('text=Generate');
    await expect(page.getByText('Demo', { exact: true })).toBeVisible({ timeout: 10000 });

    if (isMobile) {
      // Should have switched to spec tab
      await expect(page.locator('section[aria-label="Specification Pane"]')).toBeVisible();
    }
  });
});
