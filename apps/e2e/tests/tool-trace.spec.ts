import { expect, test } from '@playwright/test';
import { loginAs } from './_helpers';

/**
 * Verifies the chat tool-trace UI. The backend now surfaces tool-call
 * and tool-result SSE frames from /chat so the frontend can show
 * "Buscando…" chips while Bonsai is invoking its tools. We stub /chat
 * with a hand-crafted SSE response to keep the test deterministic
 * (LLM-driven tool calls are non-deterministic).
 *
 * Sequence on the wire:
 *   1. tool-call rag-query-tool          → chip appears, running state
 *   2. tool-call present-resource        → second chip appears
 *   3. text-delta "Aquí tienes el…"      → text body starts filling
 *   4. tool-result rag-query-tool        → first chip flips to done
 *   5. tool-result present-resource      → second chip flips to done
 *   6. event: done                        → stream ends
 */
test.describe('bonsai · chat tool trace', () => {
  test('chips appear while tools run and dim when they finish', async ({ page }) => {
    await page.route('**/chat', async (route) => {
      const body =
        'data: {"type":"tool-call","toolName":"rag-query-tool","toolCallId":"tc-1"}\n\n' +
        'data: {"type":"tool-call","toolName":"present-resource","toolCallId":"tc-2"}\n\n' +
        'data: {"type":"text","delta":"Aquí tienes el nodo de Compliance."}\n\n' +
        'data: {"type":"tool-result","toolName":"rag-query-tool","toolCallId":"tc-1"}\n\n' +
        'data: {"type":"tool-result","toolName":"present-resource","toolCallId":"tc-2"}\n\n' +
        'event: done\n' +
        'data: {"type":"done","threadId":"e2e-thread-tools"}\n\n';
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body,
      });
    });

    await loginAs(page, 'learner');

    await page.locator('.bonsai-open').first().click();
    const composer = page.locator('textarea[placeholder*="Pregúntale"]').first();
    await expect(composer).toBeVisible({ timeout: 15_000 });

    await composer.fill('Cuéntame sobre el nodo de Compliance.');
    await composer.press('Enter');

    // The trace container shows up inside the assistant message.
    const trace = page.locator('[data-testid="tool-trace"]').last();
    await expect(trace).toBeVisible({ timeout: 10_000 });

    // Both chips exist and end up in the "done" state once the stream
    // completes. We just assert the terminal state rather than racing
    // against the running phase.
    const ragChip = trace.locator('.tool-chip[data-tool="rag-query-tool"]');
    const presentChip = trace.locator('.tool-chip[data-tool="present-resource"]');
    await expect(ragChip).toHaveAttribute('data-done', 'true', { timeout: 5_000 });
    await expect(presentChip).toHaveAttribute('data-done', 'true', { timeout: 5_000 });

    // The human labels are visible too.
    await expect(ragChip).toContainText('Buscando en el catálogo');
    await expect(presentChip).toContainText('Cargando recurso');

    // The text deltas land normally.
    const reply = page.locator('.msg.bonsai .msg-text').last();
    await expect(reply).toContainText('Aquí tienes el nodo de Compliance');
  });
});
