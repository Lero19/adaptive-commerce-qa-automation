
import 'dotenv/config';

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
  defaultTimeoutMs: Number(process.env.DEFAULT_TIMEOUT_MS ?? 60_000)
};

if (!Number.isFinite(environment.defaultTimeoutMs) || environment.defaultTimeoutMs < 1) {
  throw new Error('DEFAULT_TIMEOUT_MS must be a positive number.');
}

if (!environment.email || !environment.password) {
  throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be configured.');
}
