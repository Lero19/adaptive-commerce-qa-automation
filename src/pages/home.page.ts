import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { HealingReporter } from '../resilience/healing-reporter';
import { environment } from '../../config/environment';
import { findResilient } from '../resilience/resilient-locator';
import { Logger } from '../../utils/logger';

export class HomePage {
  private readonly log = Logger.for('HomePage');
  private readonly page: Page;
  private readonly reporter: HealingReporter;

  constructor(page: Page, reporter: HealingReporter) {
    this.page = page;
    this.reporter = reporter;
  }

  async navigate(): Promise<void> {
    this.log.info(`Opening the home page: ${environment.baseUrl}`);
    await this.page.goto(environment.baseUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  }

  /** The nav link has no id, so the most specific stable hook (class within header) is primary. */
  async clickRegister(): Promise<void> {
    const link = await findResilient(this.page, {
      name: 'Header: Register link',
      primary: { type: 'css', value: '.header-links a.ico-register' },
      fallbacks: [
        { type: 'css', value: '.header-links a[href="/register"]' },
        { type: 'role', role: 'link', name: 'Register' },
        { type: 'text', value: 'Register' }
      ],
      reporter: this.reporter
    });
    this.log.info('Clicking the Register link in the header');
    await link.click();
    await this.page.waitForURL(/\/register/);
    this.log.info('Redirected to the registration page', { url: this.page.url() });
  }

  async expectLoggedInAs(email: string): Promise<void> {
    this.log.info(`Verifying the user is logged in as ${email}`);
    const account = this.page.locator('.header-links a.account');
    await expect(account).toHaveText(email);
    await expect(this.page.locator('.header-links a.ico-logout')).toBeVisible();
    await expect(this.page.locator('.header-links a.ico-login')).toHaveCount(0);
    this.log.info('User is logged in: account email and Log out link are shown');
  }
}