import 'dotenv/config';

const default_timeout = 60_000;

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
}

export const environment = {
  baseUrl: process.env.BASE_URL ?? 'https://demowebshop.tricentis.com',

  email: process.env.TEST_USER_EMAIL ?? '',
  password: process.env.TEST_USER_PASSWORD ?? '',

  headless: bool(process.env.HEADLESS, false),
  browser: process.env.BROWSER ?? 'chromium',
  defaultTimeoutMs: Number(process.env.DEFAULT_TIMEOUT_MS ?? default_timeout),

  // Used for headless runs (e.g. Jenkins) and for non-Chromium browsers, which ignore --start-maximized.
  viewportWidth: Number(process.env.VIEWPORT_WIDTH ?? 1920),
  viewportHeight: Number(process.env.VIEWPORT_HEIGHT ?? 1080)
};

if (!Number.isFinite(environment.defaultTimeoutMs) || environment.defaultTimeoutMs < 1) {
  throw new Error('DEFAULT_TIMEOUT_MS must be a positive number.');
}

if (
  !Number.isFinite(environment.viewportWidth) || environment.viewportWidth < 1 ||
  !Number.isFinite(environment.viewportHeight) || environment.viewportHeight < 1
) {
  throw new Error('VIEWPORT_WIDTH and VIEWPORT_HEIGHT must be positive numbers.');
}

if (!environment.email || !environment.password) {
  throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be configured.');
}