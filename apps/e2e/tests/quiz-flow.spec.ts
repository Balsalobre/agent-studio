import { expect, test } from '@playwright/test';
import { loginAs } from './_helpers';
import { clearLearnerProgress, markStepCompleted, STEPS } from './_db';

/**
 * Quiz flow against the seeded banking route. Step 2 (COMP-01.1 ·
 * "Prevención de Fraude y Delitos Financieros") is a `quiz` step with three
 * multiple-choice questions stored in the route. Bonsai surfaces them in
 * chat, the learner answers, and grade-quiz + mark-step-complete close it.
 *
 * Correct answers (1-based, as the learner types them in chat):
 *   Q1 ¿qué es una bandera roja?              → opción 2
 *   Q2 ante una sospecha, ¿qué protocolo?     → opción 3
 *   Q3 ejemplo de fraude interno              → opción 2
 */
test.describe('bonsai · quiz flow', () => {
  test.beforeEach(async () => {
    // Put the learner right before the fraud quiz: complete the first node
    // directly via the DB. Driving the UI through earlier steps would be
    // slow (RAG + DeepSeek per turn) and brittle (LLM phrasing varies).
    await clearLearnerProgress();
    await markStepCompleted(STEPS.certificacionCompliance, { via: 'e2e-setup' });
  });

  test('chat surfaces the fraud-prevention quiz and Bonsai grades the learner', async ({ page }) => {
    await loginAs(page, 'learner');

    // Switch from the route view to the chat composer.
    await page.locator('.bonsai-open').first().click();
    const composer = page.locator('textarea[placeholder*="Pregúntale"]').first();
    await expect(composer).toBeVisible({ timeout: 15_000 });

    // Turn 1 — ask Bonsai to start the fraud-prevention quiz.
    await composer.fill('Quiero hacer el quiz de Prevención de Fraude.');
    await composer.press('Enter');

    const bonsaiMessages = page.locator('.msg.bonsai .msg-text');
    await expect(bonsaiMessages.last()).toBeVisible({ timeout: 60_000 });

    // The reply is streamed; assert the assembled text references content
    // from the seeded questions (red flags / fraud / escalation to
    // Audit & Risk). Generous matcher — wording is LLM-decided.
    await expect.poll(
      async () => (await bonsaiMessages.last().textContent()) ?? '',
      { timeout: 60_000, intervals: [500, 1000, 2000] },
    ).toMatch(/(bandera roja|red flag|fraude|escal|auditor|riesgos)/i);

    // Turn 2 — answer with the canonical correct picks. Bonsai converts the
    // 1-based chat input to 0-based grade-quiz args server-side.
    await composer.fill('Mis respuestas: pregunta 1, opción 2; pregunta 2, opción 3; pregunta 3, opción 2.');
    await composer.press('Enter');

    // Bonsai's grading reply should reference success. Generous matcher.
    await expect.poll(
      async () => {
        const all = await bonsaiMessages.allTextContents();
        return all.join('\n');
      },
      { timeout: 60_000, intervals: [500, 1000, 2000] },
    ).toMatch(/(100|aprobad|acertad|correct|completad|enhorabuena|superad)/i);
  });
});
