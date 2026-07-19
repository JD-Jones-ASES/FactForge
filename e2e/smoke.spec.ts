import { test, expect } from '@playwright/test';

test('hub lists packs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /missing fact/i })).toBeVisible();
  await expect(page.locator('[data-pack="integer-ops"]')).toBeVisible();
  await expect(page.locator('[data-pack="factor-quad"]')).toBeVisible();
  await expect(page.locator('[data-pack="proportion"]')).toBeVisible();
});

test('integer-ops play loop with Enter', async ({ page }) => {
  await page.goto('/play/integer-ops');
  const start = page.getByTestId('start-play');
  await expect(start).toBeVisible();
  await start.press('Enter');
  await expect(page.getByTestId('relation-display')).toBeVisible();
  const input = page.getByTestId('answer-input');
  await expect(input).toBeFocused();
  await input.fill('999999');
  await input.press('Enter');
  await expect(page.getByTestId('feedback')).toBeVisible();
});

test('fraction-ops starts', async ({ page }) => {
  await page.goto('/play/fraction-ops');
  await page.getByTestId('start-play').click();
  await expect(page.getByTestId('relation-display')).toBeVisible();
});

test('preset play=1 skips setup', async ({ page }) => {
  // minimal empty config still parses to defaults after pack.parseConfig merge
  await page.goto('/play/gcf-lcm?c=e30&play=1'); // e30 = {}
  await expect(page.getByTestId('relation-display')).toBeVisible({ timeout: 10_000 });
});
