import { expect, test } from '@playwright/test';
import { loginAs, openRole, SEEDED } from './_helpers';

test.describe('bonsai · smoke', () => {
  test('login overlay renders with the two seeded quick-picks', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.login-card')).toBeVisible();
    await expect(page.locator('.login-quick-btn', { hasText: SEEDED.learner.email })).toBeVisible();
    await expect(page.locator('.login-quick-btn', { hasText: SEEDED.manager.email })).toBeVisible();
  });

  test('learner: login then "Mi aprendizaje" lists the seeded route steps', async ({ page }) => {
    await loginAs(page, 'learner');

    // The default layout for learners is "Mi aprendizaje" — the route view.
    // The MiAprendizaje component renders one step block per route step.
    // The seeded banking route has 13 nodes (3 nodos + their subnodos).
    await expect(page.locator('.step').first()).toBeVisible({ timeout: 15_000 });
    const steps = await page.locator('.step').count();
    expect(steps).toBe(13);
  });

  test('manager: docs panel loads catalogue from /resources', async ({ page }) => {
    await loginAs(page, 'manager');

    // Manager lands on the Manager panel by default. Wait for the docs
    // section header to show, then for at least one row to render.
    await expect(page.locator('text=Documentos de empresa')).toBeVisible({ timeout: 10_000 });
    // Wait for either an item row OR a "no resources" empty state.
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('.doc-row');
      return rows.length > 0;
    }, { timeout: 15_000 });

    const docRows = await page.locator('.doc-row').count();
    expect(docRows).toBeGreaterThan(0);
  });
});
