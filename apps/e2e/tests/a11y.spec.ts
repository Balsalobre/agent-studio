import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { loginAs } from './_helpers';

/**
 * Lightweight accessibility audit. We don't enforce a fully-clean axe scan
 * (the prototype is a designed surface; some heavy violations live in the
 * upstream design system) but we DO fail on the categories that most often
 * indicate something genuinely broken: missing form labels, missing button
 * names, and broken landmark structure.
 */
const FATAL_RULES = [
  'button-name',
  'label',
  'link-name',
  'document-title',
  'html-has-lang',
] as const;

async function scan(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
}

test.describe('bonsai · accessibility', () => {
  test('login overlay has no fatal axe violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.login-card')).toBeVisible({ timeout: 15_000 });

    const results = await scan(page);
    const fatal = results.violations.filter((v) => (FATAL_RULES as readonly string[]).includes(v.id));
    if (fatal.length > 0) {
      console.log('Fatal a11y violations on login overlay:', JSON.stringify(fatal, null, 2));
    }
    expect(fatal).toEqual([]);
  });

  test('learner home (Mi aprendizaje) has no fatal axe violations', async ({ page }) => {
    await loginAs(page, 'learner');
    await expect(page.locator('.step').first()).toBeVisible({ timeout: 15_000 });

    const results = await scan(page);
    const fatal = results.violations.filter((v) => (FATAL_RULES as readonly string[]).includes(v.id));
    if (fatal.length > 0) {
      console.log('Fatal a11y violations on learner home:', JSON.stringify(fatal, null, 2));
    }
    expect(fatal).toEqual([]);
  });

  test('manager panel has no fatal axe violations', async ({ page }) => {
    await loginAs(page, 'manager');
    await expect(page.locator('text=Documentos de empresa')).toBeVisible({ timeout: 10_000 });

    const results = await scan(page);
    const fatal = results.violations.filter((v) => (FATAL_RULES as readonly string[]).includes(v.id));
    if (fatal.length > 0) {
      console.log('Fatal a11y violations on manager panel:', JSON.stringify(fatal, null, 2));
    }
    expect(fatal).toEqual([]);
  });
});
