import { expect, test } from '@playwright/test';
import { loginAs } from './_helpers';

/**
 * Verifies that Bonsai replies render rich resource cards when the chat
 * surfaces resources via the present-resource / recommend-resources
 * tools. We stub /chat with a synthetic SSE response to lock the test
 * to the wire contract (LLM-driven tool runs are non-deterministic).
 *
 * The payload mirrors the seeded banking route: present a route node
 * (Compliance certification) plus two complementary library
 * recommendations (an audio and an ebook).
 */
test.describe('bonsai · resource cards', () => {
  test('chat renders one card per resource surfaced by present/recommend tools', async ({ page }) => {
    await page.route('**/chat', async (route) => {
      const body =
        // 1. present-resource for the Compliance certification node
        'data: {"type":"tool-call","toolName":"present-resource","toolCallId":"tc-1"}\n\n' +
        'data: {"type":"tool-result","toolName":"present-resource","toolCallId":"tc-1"}\n\n' +
        'data: ' + JSON.stringify({
          type: 'resource-card',
          resource: {
            id: 'res-comp-01',
            organizationId: 'acme-org',
            type: 'learning_experience',
            title: 'Certificación Integral en Compliance y Ética Bancaria',
            status: 'indexed',
            source: { provider: 'bank-learning', url: 'https://bank-learning.com/compliance/certificacion-integral' },
            metadata: { description: 'Programa maestro de cumplimiento normativo.', durationSec: 3600 },
          },
        }) + '\n\n' +
        // 2. text delta
        'data: {"type":"text","delta":"Aquí tienes tu nodo de Compliance y un par de recomendaciones extra."}\n\n' +
        // 3. recommend-resources returning two complementary library cards
        'data: {"type":"tool-call","toolName":"recommend-resources","toolCallId":"tc-2"}\n\n' +
        'data: {"type":"tool-result","toolName":"recommend-resources","toolCallId":"tc-2"}\n\n' +
        'data: ' + JSON.stringify({
          type: 'resource-card',
          resource: {
            id: 'rec-podcast-compliance',
            organizationId: 'acme-org',
            type: 'audio',
            title: 'Podcast: Cultura de cumplimiento en banca',
            status: 'mock',
            source: { format: 'mp3' },
            metadata: { description: '25 min sobre ética bancaria.', durationSec: 1500 },
          },
        }) + '\n\n' +
        'data: ' + JSON.stringify({
          type: 'resource-card',
          resource: {
            id: 'rec-ebook-liderazgo',
            organizationId: 'acme-org',
            type: 'ebook',
            title: 'eBook: Liderazgo inclusivo en el sector financiero',
            status: 'mock',
            source: { format: 'epub' },
            metadata: { description: 'Diversidad y sesgos inconscientes.', pages: 180 },
          },
        }) + '\n\n' +
        'event: done\n' +
        'data: {"type":"done","threadId":"e2e-thread-cards"}\n\n';
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

    await composer.fill('Muéstrame mi nodo de Compliance y algo similar.');
    await composer.press('Enter');

    // Three cards rendered inside the assistant message.
    const cards = page.locator('[data-testid="resource-card"]');
    await expect(cards).toHaveCount(3, { timeout: 10_000 });

    // Each card carries the right type + title.
    await expect(cards.nth(0)).toHaveAttribute('data-resource-type', 'learning_experience');
    await expect(cards.nth(0)).toContainText('Certificación Integral en Compliance');
    await expect(cards.nth(0)).toContainText('60 min'); // durationSec → "60 min"

    await expect(cards.nth(1)).toHaveAttribute('data-resource-type', 'audio');
    await expect(cards.nth(1)).toContainText('Cultura de cumplimiento');
    await expect(cards.nth(1)).toContainText('25 min'); // durationSec → "25 min"

    await expect(cards.nth(2)).toHaveAttribute('data-resource-type', 'ebook');
    await expect(cards.nth(2)).toContainText('Liderazgo inclusivo');
    await expect(cards.nth(2)).toContainText('180 págs.'); // pages → "180 págs."

    // Clicking "Abrir" on the first card hits POST /resources/:id/open.
    // We intercept that to confirm the wiring works.
    let openHit = null as string | null;
    await page.route('**/resources/*/open', async (route) => {
      const url = route.request().url();
      openHit = url;
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true }),
      });
    });
    await cards.nth(0).locator('[data-testid="resource-card-open"]').click();
    await expect.poll(() => openHit).toContain('/resources/res-comp-01/open');
  });
});
