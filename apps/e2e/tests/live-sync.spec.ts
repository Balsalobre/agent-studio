import { expect, test } from '@playwright/test';
import { loginAs } from './_helpers';

/**
 * Verifies the chat → learning-view live-sync plumbing without the LLM
 * round trip. We intercept POST /chat with page.route and stream back a
 * synthetic SSE response that ends with `event: done` carrying
 * stepCompleted. chat.jsx should dispatch `bonsai:step-completed` on
 * window and render the pill marker in the message. learning.jsx (when
 * mounted) listens to that event and refetches /progress.
 *
 * This deliberately bypasses DeepSeek + tool calling because the multi-
 * tool sequence (evaluate-answer + mark-step-complete) is non-determi-
 * nistic in practice — the model occasionally narrates the completion
 * instead of invoking the second tool. Locking the test to a real LLM
 * makes the spec flaky; locking it to the SSE contract makes it precise.
 */
test.describe('bonsai · live progress sync (SSE contract)', () => {
  test('chat.jsx dispatches bonsai:step-completed on event:done with stepCompleted', async ({ page }) => {
    // Stub /chat with a fixed SSE response.
    await page.route('**/chat', async (route) => {
      const body =
        // Three text-delta frames + a done event with stepCompleted.
        'data: {"type":"text","delta":"He marcado tu paso como completado. "}\n\n' +
        'data: {"type":"text","delta":"Avanzas al siguiente."}\n\n' +
        'event: done\n' +
        'data: {"type":"done","threadId":"e2e-thread-abc12345","stepCompleted":"step-comp-01-1"}\n\n';
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body,
      });
    });

    await loginAs(page, 'learner');

    // Switch to the chat composer.
    await page.locator('.bonsai-open').first().click();
    const composer = page.locator('textarea[placeholder*="Pregúntale"]').first();
    await expect(composer).toBeVisible({ timeout: 15_000 });

    // Buffer all bonsai:step-completed events.
    await page.evaluate(() => {
      (window as unknown as { __stepEvents: unknown[] }).__stepEvents = [];
      window.addEventListener('bonsai:step-completed', (e: Event) => {
        const ce = e as CustomEvent<{ stepId?: string; threadId?: string }>;
        (window as unknown as { __stepEvents: unknown[] }).__stepEvents.push(ce.detail);
      });
    });

    // Any user message triggers the stubbed /chat response.
    await composer.fill('marca el paso de prevención de fraude');
    await composer.press('Enter');

    // The synthetic SSE finishes well under 10s — chat.jsx's onDone runs
    // synchronously after the stream ends.
    await expect.poll(
      async () => await page.evaluate(() =>
        (window as unknown as { __stepEvents: { stepId?: string }[] }).__stepEvents.length,
      ),
      { timeout: 10_000, intervals: [200, 500] },
    ).toBeGreaterThan(0);

    const events = await page.evaluate(() =>
      (window as unknown as { __stepEvents: { stepId?: string; threadId?: string }[] }).__stepEvents,
    );
    expect(events[0]).toEqual({
      stepId: 'step-comp-01-1',
      threadId: 'e2e-thread-abc12345',
    });

    // And the visible pill marker.
    await expect(page.locator('[data-testid="step-completed-pill"]')).toBeVisible();
    await expect(page.locator('[data-testid="step-completed-pill"]')).toHaveText(/step-comp-01-1/);

    // The deltas were also appended to the assistant message.
    const lastReply = await page.locator('.msg.bonsai .msg-text').last().textContent();
    expect(lastReply).toContain('He marcado tu paso como completado');
    expect(lastReply).toContain('Avanzas al siguiente');
  });

  test('learning.jsx listener calls /progress when the event is dispatched', async ({ page }) => {
    // Confirm the listener wired up by learning.jsx fires a fresh
    // /progress fetch. We intercept /progress to count hits.
    let progressHits = 0;
    await page.route('**/progress', async (route) => {
      progressHits += 1;
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: [] }),
      });
    });

    await loginAs(page, 'learner');

    // The learning view mounts on login (default chatLayout=aprendizaje)
    // and fetches /progress once during initial load. Wait for that.
    await expect.poll(() => progressHits, { timeout: 10_000 }).toBeGreaterThan(0);
    const initialHits = progressHits;

    // Dispatch the event from the test side. learning.jsx's listener
    // should react and refetch /progress.
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('bonsai:step-completed', {
        detail: { stepId: 'step-comp-01-1', threadId: 'e2e-thread-xyz' },
      }));
    });

    await expect.poll(() => progressHits, { timeout: 5_000 }).toBeGreaterThan(initialHits);
  });
});
