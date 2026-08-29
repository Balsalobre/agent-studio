import { expect, test } from '@playwright/test';
import { loginAs } from './_helpers';

/**
 * Verifies that Bonsai replies render markdown (headers, lists, tables,
 * code blocks, links) instead of leaking raw syntax. Backend stubbed
 * with a hand-crafted SSE payload that contains every relevant element.
 *
 * Link policy is also exercised: legit http(s) URIs become anchor tags
 * with target=_blank rel=noopener, while a javascript: URI is stripped
 * down to its label (no anchor emitted).
 */
test.describe('bonsai · markdown rendering', () => {
  test('headers, lists, tables, code and links render as real HTML', async ({ page }) => {
    const markdown = [
      '## Señales de fraude (red flags)',
      '',
      'Las **tres** banderas rojas más frecuentes son:',
      '',
      '- `transferencia-atipica`',
      '- `documento-alterado`',
      '- `acceso-fuera-horario`',
      '',
      'Ante cualquiera de ellas, escala al departamento de `Auditoría y Riesgos`.',
      '',
      '| Tipología | Riesgo | Reportable |',
      '|---|---|---|',
      '| Fraude interno | Alto | sí |',
      '| Phishing a cliente | Medio | sí |',
      '',
      '```text',
      'asistente> ¿Cuál es el límite sin doble aprobación?',
      'asistente> Importe máximo: 50.000 € por operación',
      '```',
      '',
      'Más info en [la guía de Compliance](https://bank-learning.com/compliance/certificacion-integral) y nunca compartas datos sensibles en sitios públicos como [aquí](javascript:alert(1)).',
    ].join('\n');

    await page.route('**/chat', async (route) => {
      // SSE expects the data lines escaped as a single JSON string; we
      // re-encode through JSON.stringify so the newlines turn into \n.
      const frames =
        'data: ' + JSON.stringify({ type: 'text', delta: markdown }) + '\n\n' +
        'event: done\n' +
        'data: {"type":"done","threadId":"e2e-markdown"}\n\n';
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        body: frames,
      });
    });

    await loginAs(page, 'learner');
    await page.locator('.bonsai-open').first().click();
    const composer = page.locator('textarea[placeholder*="Pregúntale"]').first();
    await expect(composer).toBeVisible({ timeout: 15_000 });

    await composer.fill('¿Cuáles son las señales de fraude?');
    await composer.press('Enter');

    const rich = page.locator('.msg.bonsai .rich-text').last();
    await expect(rich).toBeVisible({ timeout: 10_000 });

    // Header
    await expect(rich.locator('h2')).toHaveText('Señales de fraude (red flags)');

    // Bullet list with 3 items, each containing a <code> chunk
    const items = rich.locator('ul > li');
    await expect(items).toHaveCount(3);
    await expect(items.nth(0).locator('code')).toHaveText('transferencia-atipica');
    await expect(items.nth(1).locator('code')).toHaveText('documento-alterado');
    await expect(items.nth(2).locator('code')).toHaveText('acceso-fuera-horario');

    // Table renders with thead + rows
    const table = rich.locator('table');
    await expect(table).toHaveCount(1);
    await expect(table.locator('thead th').nth(0)).toHaveText('Tipología');
    const dataRows = table.locator('tbody tr');
    await expect(dataRows).toHaveCount(2);

    // Code block (fenced) renders as <pre><code>
    const codeBlock = rich.locator('pre code').first();
    await expect(codeBlock).toContainText('límite sin doble aprobación');
    await expect(codeBlock).toContainText('50.000');

    // Legit link → anchor with target=_blank
    const docsLink = rich.locator('a', { hasText: 'la guía de Compliance' });
    await expect(docsLink).toHaveAttribute('href', 'https://bank-learning.com/compliance/certificacion-integral');
    await expect(docsLink).toHaveAttribute('target', '_blank');
    await expect(docsLink).toHaveAttribute('rel', /noopener/);

    // javascript: URI was stripped — no anchor with that label, just text.
    await expect(rich.locator('a', { hasText: 'aquí' })).toHaveCount(0);
    await expect(rich).toContainText('aquí');
  });
});
