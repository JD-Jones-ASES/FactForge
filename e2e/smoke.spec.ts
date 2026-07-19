import { test, expect } from '@playwright/test';

test('hub lists packs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /missing fact/i })).toBeVisible();
  await expect(page.locator('[data-pack="integer-ops"]')).toBeVisible();
  await expect(page.locator('[data-pack="factor-quad"]')).toBeVisible();
});

test('integer-ops play loop', async ({ page }) => {
  await page.goto('/play/integer-ops');
  const start = page.getByTestId('start-play');
  await expect(start).toBeVisible();
  await start.click();
  await expect(page.getByTestId('relation-display')).toBeVisible();
  await expect(page.getByTestId('answer-input')).toBeVisible();
  await page.getByTestId('answer-input').fill('999999');
  await page.getByTestId('submit-answer').click();
  await expect(page.getByTestId('feedback')).toBeVisible();
});

test('fraction-ops starts', async ({ page }) => {
  await page.goto('/play/fraction-ops');
  await page.getByTestId('start-play').click();
  await expect(page.getByTestId('relation-display')).toBeVisible();
});
