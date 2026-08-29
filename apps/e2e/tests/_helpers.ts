import { expect, type Page, type APIRequestContext } from '@playwright/test';

const FRONT_PAGE = '/';
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4111';

export const SEEDED = {
  learner: { email: 'learner@acme.us', id: 'acme-learner' },
  manager: { email: 'manager@acme.us', id: 'acme-manager' },
} as const;

/**
 * Load the prototype with a clean session and dismiss the login overlay by
 * clicking the quick-pick button for the requested role. Awaits the main
 * surface to be visible.
 */
export async function loginAs(page: Page, role: 'learner' | 'manager'): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem('bonsai.token');
      localStorage.removeItem('bonsai.user');
      localStorage.removeItem('bonsai.thread');
    } catch { /* ignore */ }
  });
  await page.goto(FRONT_PAGE);

  // Wait for the LoginOverlay to render — it's gated by BonsaiAPI being ready.
  await expect(page.locator('.login-card')).toBeVisible({ timeout: 15_000 });

  const email = SEEDED[role].email;
  await page.locator('.login-quick-btn', { hasText: email }).click();

  // The overlay tears itself down once the session is set; wait for the rail
  // to appear, which means App rendered.
  await expect(page.locator('.login-overlay')).toHaveCount(0, { timeout: 15_000 });
  await expect(page.locator('nav.rail')).toBeVisible({ timeout: 10_000 });
}

/**
 * POST /dev/login directly against the backend. Useful for resetting state
 * via the backend before driving the browser.
 */
export async function fetchToken(
  request: APIRequestContext,
  email: string,
): Promise<string> {
  const res = await request.post(`${BACKEND_URL}/dev/login`, {
    data: { email },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.ok(), `dev/login ${email}`).toBeTruthy();
  const body = await res.json();
  return body.token as string;
}

/**
 * Best-effort cleanup of learner_progress between specs so the route renders
 * deterministically (everything pending). Uses the public progress GET to
 * verify; full reset would require a dedicated backend endpoint, which we
 * don't have — instead we sequence specs serially and accept that state may
 * carry forward.
 */
export async function clearLearnerProgress(request: APIRequestContext): Promise<void> {
  const token = await fetchToken(request, SEEDED.learner.email);
  const res = await request.get(`${BACKEND_URL}/progress`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return;
  // No DELETE endpoint exists; this is a hook for future reset support.
}

export async function openRole(page: Page, role: 'chat' | 'manager' | 'insights' | 'admin'): Promise<void> {
  await page.locator(`nav.rail .rail-btn`).nth(['chat', 'manager', 'insights', 'admin'].indexOf(role)).click();
}
