import { test, expect } from '@playwright/test';
import { listPacks } from '../src/lib/engine/registry';

test('hub lists every registered pack', async ({ page }) => {
  const packs = listPacks();
  expect(packs.length).toBeGreaterThanOrEqual(55);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /missing fact/i })).toBeVisible();
  await expect(page.locator('[data-band="Arithmetic"]')).toBeVisible();
  await expect(page.locator('[data-band="Algebra"]')).toBeVisible();
  await expect(page.locator('[data-band="Functions"]')).toBeVisible();
  await expect(page.locator('[data-band="Data"]')).toBeVisible();
  await expect(page.getByRole('navigation', { name: /jump to band/i })).toBeVisible();

  for (const pack of packs) {
    await expect(page.locator(`[data-pack="${pack.id}"]`)).toBeVisible();
  }
});

test('each pack play route loads without pageerror', async ({ page }) => {
  for (const pack of listPacks()) {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`${pack.id}: ${err.message}`));
    await page.goto(`/play/${pack.id}`);
    await expect(
      page.getByTestId('start-play').or(page.getByTestId('relation-display')),
    ).toBeVisible({ timeout: 15_000 });
    expect(errors, pack.id).toEqual([]);
  }
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

test('builder page loads packs', async ({ page }) => {
  await page.goto('/builder');
  await expect(page.getByRole('heading', { name: /snap a custom drill/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Integer ops' })).toBeVisible();
  await expect(page.getByRole('link', { name: /open play link/i })).toBeVisible();
});

test('triangle-sum shows figure', async ({ page }) => {
  await page.goto('/play/triangle-sum');
  await page.getByTestId('start-play').click();
  await expect(page.getByTestId('figure-view')).toBeVisible();
  await expect(page.getByTestId('relation-display')).toBeVisible();
});

test('unit-circle offers choice chips including Undefined', async ({ page }) => {
  await page.goto('/play/unit-circle');
  await page.getByTestId('start-play').click();
  await expect(page.getByTestId('choice-bar')).toBeVisible();
  await expect(page.getByRole('option', { name: 'Undefined' })).toBeVisible();
});

test('pythagorean shows figure', async ({ page }) => {
  await page.goto('/play/pythagorean');
  await page.getByTestId('start-play').click();
  await expect(page.getByTestId('figure-view')).toBeVisible();
  await expect(page.getByTestId('relation-display')).toBeVisible();
});

for (const id of ['area-perimeter', 'polygon-angles', 'arc-sector', 'vertex', 'special-right']) {
  test(`${id} shows figure`, async ({ page }) => {
    await page.goto(`/play/${id}`);
    await page.getByTestId('start-play').click();
    await expect(page.getByTestId('figure-view')).toBeVisible();
    await expect(page.getByTestId('relation-display')).toBeVisible();
  });
}

test('inverse-trig offers angle chips', async ({ page }) => {
  await page.goto('/play/inverse-trig');
  await page.getByTestId('start-play').click();
  await expect(page.getByTestId('choice-bar')).toBeVisible();
  await expect(page.getByRole('option', { name: '0°', exact: true })).toBeVisible();
});

test('solve-quad grades a typed solution list', async ({ page }) => {
  await page.goto('/play/solve-quad');
  await page.getByTestId('start-play').click();
  await expect(page.getByTestId('relation-display')).toBeVisible();
  const input = page.getByTestId('answer-input');
  await input.fill('x = 1000, -1000');
  await input.press('Enter');
  await expect(page.getByTestId('feedback')).toBeVisible();
});
