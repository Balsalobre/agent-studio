import { expect, test } from '@playwright/test';
import { loginAs } from './_helpers';
import { clearLearnerProgress } from './_db';

/**
 * Consume flow: clicking a resource chip on a `consume` step POSTs
 * /resources/:id/open, the backend auto-completes the step, and the card
 * flips to the "done" state. The seeded banking route's nodes carry an
 * external course URL (bank-learning.com), so a click also opens a new tab —
 * we swallow that popup and assert the step completion.
 *
 * We target only `consume` steps here (quiz/evaluation steps are driven via
 * the chat in quiz-flow.spec.ts):
 *   · step 1  (nth 0)  COMP-01    "Certificación Integral en Compliance…"
 *   · step 3  (nth 2)  COMP-01.2  "Protección de Datos Personales…"
 */
test.describe('bonsai · consume flow', () => {
  test.beforeEach(async () => {
    // Each spec needs a clean baseline so the chip we click is unambiguously
    // the trigger of the completion (every step starts non-done).
    await clearLearnerProgress();
  });

  async function clickChipAndSwallowPopup(
    context: import('@playwright/test').BrowserContext,
    chip: import('@playwright/test').Locator,
  ) {
    // Nodes have source.url, so the UI also fires window.open. Listen for the
    // popup and close it; the real assertion is the step flip.
    const popupPromise = context.waitForEvent('page', { timeout: 5_000 }).catch(() => null);
    await chip.click();
    const popup = await popupPromise;
    if (popup) await popup.close().catch(() => undefined);
  }

  test('learner clicks the Compliance node chip and step 1 auto-completes', async ({ page, context }) => {
    await loginAs(page, 'learner');

    const step1 = page.locator('.step').first();
    await expect(step1).toBeVisible({ timeout: 10_000 });
    // clearLearnerProgress guarantees step 1 is not yet done.
    await expect(step1).not.toHaveClass(/is-done/);

    const chip = step1.locator('.chip', { hasText: 'Certificación Integral en Compliance' });
    await expect(chip).toBeVisible();

    await clickChipAndSwallowPopup(context, chip);

    // The step card flips to the "done" state once /progress refetches.
    await expect(step1).toHaveClass(/is-done/, { timeout: 15_000 });
  });

  test('clicking the Protección de Datos chip completes step 3 and opens a new tab', async ({ page, context }) => {
    await loginAs(page, 'learner');

    const step3 = page.locator('.step').nth(2);
    await expect(step3).toBeVisible({ timeout: 10_000 });
    await expect(step3).not.toHaveClass(/is-done/);

    const chip = step3.locator('.chip', { hasText: 'Protección de Datos Personales' });
    await expect(chip).toBeVisible();

    await clickChipAndSwallowPopup(context, chip);

    await expect(step3).toHaveClass(/is-done/, { timeout: 15_000 });
  });
});
