import { expect, test } from '@playwright/test';
import { loginAs } from './_helpers';

/**
 * Threads history side panel: the persistent panel lists threads from
 * /threads; clicking one clears the in-memory chat, shows the resume banner,
 * and makes the subsequent /chat call use that threadId.
 *
 * /threads is stubbed so the spec is independent of whatever lives in
 * mastra_threads at test time.
 */
test.describe('bonsai · threads history', () => {
  test('learner can resume an old thread from the side panel', async ({ page }) => {
    const fakeThreads = [
      { id: 'thread-aaa', title: 'Prevención de fraude y red flags', createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-03T15:30:00Z' },
      { id: 'thread-bbb', title: 'Protección de datos y secreto bancario', createdAt: '2026-06-02T09:00:00Z', updatedAt: '2026-06-02T11:20:00Z' },
      { id: 'thread-ccc', title: null,                                createdAt: '2026-06-03T07:00:00Z', updatedAt: '2026-06-03T07:10:00Z' },
    ];

    await page.route('**/threads*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threads: fakeThreads, total: fakeThreads.length }),
      });
    });

    // Capture the threadId in the next /chat call so we can verify the
    // resume actually flowed through.
    let chatThreadId = null as string | null;
    await page.route('**/chat', async (route) => {
      try {
        const body = JSON.parse(route.request().postData() || '{}');
        chatThreadId = body.threadId ?? null;
      } catch { /* ignore */ }
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        body:
          'data: {"type":"text","delta":"Continuamos desde donde lo dejaste."}\n\n' +
          'event: done\n' +
          'data: {"type":"done","threadId":"thread-aaa"}\n\n',
      });
    });

    await loginAs(page, 'learner');

    // Switch to the chat composer.
    await page.locator('.bonsai-open').first().click();
    const composer = page.locator('textarea[placeholder*="Pregúntale"]').first();
    await expect(composer).toBeVisible({ timeout: 15_000 });

    // The conversations panel lives in the left menu (learner area).
    const panel = page.locator('[data-testid="threads-panel"]');
    await expect(panel).toBeVisible();

    // All three threads render, including the unnamed one.
    const items = page.locator('[data-testid="threads-item"]');
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText('Prevención de fraude');
    await expect(items.nth(1)).toContainText('Protección de datos');
    await expect(items.nth(2)).toContainText('Conversación sin título');

    // Click the first thread → it becomes active, resume banner shows,
    // localStorage takes the new threadId.
    await items.nth(0).click();
    await expect(items.nth(0)).toHaveClass(/is-active/);
    const banner = page.locator('[data-testid="resume-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Prevención de fraude');

    const persistedThreadId = await page.evaluate(() => localStorage.getItem('bonsai.thread'));
    expect(persistedThreadId).toBe('thread-aaa');

    // Sending a new message uses the persisted threadId.
    await composer.fill('Sigamos.');
    await composer.press('Enter');
    await expect.poll(() => chatThreadId, { timeout: 5_000 }).toBe('thread-aaa');
  });

  test('"Nueva conversación" clears the thread id', async ({ page }) => {
    await page.route('**/threads*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ threads: [], total: 0 }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await loginAs(page, 'learner');
    await page.locator('.bonsai-open').first().click();
    await expect(page.locator('textarea[placeholder*="Pregúntale"]').first()).toBeVisible();

    // Pre-seed a thread id so we can verify it gets cleared.
    await page.evaluate(() => localStorage.setItem('bonsai.thread', 'thread-zzz'));
    expect(await page.evaluate(() => localStorage.getItem('bonsai.thread'))).toBe('thread-zzz');

    // Click "Nueva conversación".
    await page.locator('.icon-btn[title="Nueva conversación"]').click();
    expect(await page.evaluate(() => localStorage.getItem('bonsai.thread'))).toBeNull();
  });
});
