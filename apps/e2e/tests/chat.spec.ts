import { expect, test } from '@playwright/test';
import { loginAs } from './_helpers';

test.describe('bonsai · chat', () => {
  test('learner can send a message and Bonsai streams a reply via SSE', async ({ page }) => {
    await loginAs(page, 'learner');

    // Default learner layout is "aprendizaje" (route view). Click the
    // BonsaiBar "Pregúntale a Bonsai" button — its onClick switches the
    // chat layout to "center", which renders the actual chat composer.
    const openChatBtn = page.locator('.bonsai-open').first();
    await expect(openChatBtn).toBeVisible({ timeout: 10_000 });
    await openChatBtn.click();

    const composer = page.locator('textarea[placeholder*="Pregúntale"]').first();
    await expect(composer).toBeVisible({ timeout: 15_000 });

    await composer.fill('Hola');
    await composer.press('Enter');

    // The first user message should appear instantly.
    await expect(page.locator('.bubble-user', { hasText: 'Hola' })).toBeVisible({ timeout: 5_000 });

    // Then a Bonsai reply gradually fills in. We wait for it to contain a
    // non-empty body — content varies because it's an LLM, so we just
    // check that *something* arrived. 60s upper bound (DeepSeek + RAG can
    // take a few seconds the first turn).
    const bonsaiMessages = page.locator('.msg.bonsai .msg-text');
    await expect(bonsaiMessages.last()).toBeVisible({ timeout: 60_000 });
    await expect(bonsaiMessages.last()).not.toBeEmpty({ timeout: 60_000 });
  });
});
