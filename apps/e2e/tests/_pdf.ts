/**
 * Tiny PDF fixture generator used by the manager-upload spec.
 *
 * pdf-lib produces a real, parseable PDF (unpdf reads it cleanly on the
 * backend, so the indexing pipeline runs the full chunk/embed flow rather
 * than failing at parse time).
 */
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface MakePdfOpts {
  readonly title: string;
  readonly body: string;
}

/** Returns a path to a temp PDF on disk so Playwright's setInputFiles can use it. */
export async function makePdfFixture(opts: MakePdfOpts): Promise<string> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([400, 300]);

  page.drawText(opts.title, { x: 40, y: 250, font: bold, size: 16 });

  // Wrap the body crudely so long lines don't overflow the page.
  const max = 50;
  const lines: string[] = [];
  let line = '';
  for (const word of opts.body.split(/\s+/)) {
    if ((line + ' ' + word).length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + ' ' + word : word;
    }
  }
  if (line) lines.push(line);

  let y = 220;
  for (const ln of lines.slice(0, 12)) {
    page.drawText(ln, { x: 40, y, font, size: 11 });
    y -= 16;
  }

  const bytes = await doc.save();
  const path = join(tmpdir(), `bonsai-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.pdf`);
  await writeFile(path, bytes);
  return path;
}
