import { defineConfig, devices } from '@playwright/test';

// The front's apiBase() (apps/bonsai/api.jsx) only points at the :4111 Mastra
// API when the static front is served on :5500 (the split-server dev
// convention); any other origin is treated as same-origin. So the e2e static
// server must run on 5500 too, otherwise /dev/login POSTs hit the static
// server and 501. Override with FRONT_URL / ?api=... if you serve elsewhere.
const FRONT_URL = process.env.FRONT_URL ?? 'http://localhost:5500';
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4111';

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Bonsai's chat uses the same Postgres DB; running specs in parallel
  // would race on shared learner_progress rows. Serial keeps state sane.
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: FRONT_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    // Provided to specs via `test.use()` if they want to call the API
    // directly (e.g. reset learner_progress).
    extraHTTPHeaders: {},
  },
  // Bring up backend + static front automatically when running `pnpm test`
  // locally. Both reuse existing servers if you already have them up.
  webServer: [
    {
      command: 'npm run --prefix ../mastra dev',
      port: 4111,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'python3 -m http.server 5500 --directory ../bonsai',
      port: 5500,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

// Re-exported so specs can hit the backend directly without re-resolving env.
export const ENV = {
  FRONT_URL,
  BACKEND_URL,
} as const;
