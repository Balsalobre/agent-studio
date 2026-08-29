import { expect, test } from '@playwright/test';
import { loginAs } from './_helpers';
import { deleteResourcesWithTitlePrefix } from './_db';
import { makePdfFixture } from './_pdf';

const TITLE_PREFIX = 'e2e-upload-';

test.describe('bonsai · manager upload', () => {
  test.beforeEach(async () => {
    // Clean up rows from prior runs that share our title prefix so the
    // assertion "the new row is visible" isn't ambiguous.
    await deleteResourcesWithTitlePrefix(TITLE_PREFIX);
  });

  test('manager uploads a PDF and it appears in the catalogue as indexed', async ({ page }) => {
    await loginAs(page, 'manager');

    // The manager view is the default landing for the manager role.
    await expect(page.locator('text=Documentos de empresa')).toBeVisible({ timeout: 10_000 });

    const docsPanel = page.locator('.panel', { hasText: 'Documentos de empresa' });

    // Generate a tiny PDF on disk. The title will be derived from the
    // filename (without .pdf), so we name it deterministically with our
    // prefix so the post-upload assertion can find it.
    const stamp = Date.now();
    const filename = `${TITLE_PREFIX}${stamp}.pdf`;
    const pdfPath = await makePdfFixture({
      title: 'Politica de e2e',
      body:
        'Este PDF se genera durante los tests automaticos para verificar el flujo de subida' +
        ' del manager. El contenido debe ser suficiente para que el indexador produzca al menos un chunk.',
    });
    // Rename the temp file so file-chooser uploads with our deterministic name.
    const { renameSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const finalPath = join(dirname(pdfPath), filename);
    renameSync(pdfPath, finalPath);

    // The dropzone is a styled div with a hidden <input type="file"> inside.
    // Playwright's locator.setInputFiles targets the input directly.
    const fileInput = docsPanel.locator('input[type="file"]');
    await fileInput.setInputFiles(finalPath);

    // The upload + indexing runs synchronously on the backend (embedMany +
    // pgVector.upsert) so the new row should appear within ~10s. Status is
    // "Indexado" when OPENAI_API_KEY has credits, otherwise "Error" — both
    // count as "the upload completed end-to-end".
    const expectedTitle = filename.replace(/\.pdf$/i, '');
    const newRow = docsPanel.locator('.doc-row', { hasText: expectedTitle });
    await expect(newRow).toBeVisible({ timeout: 30_000 });

    const badge = newRow.locator('.badge');
    await expect(badge).toHaveText(/Indexado|Error/, { timeout: 30_000 });
  });
});
