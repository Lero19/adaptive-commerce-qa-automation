
import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import type { HealingReporter } from '../resilience/healing-reporter';
import type { LocatorStrategy } from '../resilience/resilient-locator';
import { findResilient } from '../resilience/resilient-locator';
import { Logger } from '../../utils/logger';

const defaultTimeout = 10_000;

export class PasswordRecoveryPage {
  private readonly log = Logger.for('PasswordRecoveryPage');
  private readonly page: Page;
  private readonly reporter: HealingReporter;

  constructor(page: Page, reporter: HealingReporter) {
    this.page = page;
    this.reporter = reporter;
  }

  private async locate(def: {
    name: string;
    primary: LocatorStrategy;
    fallbacks: LocatorStrategy[];
  }): Promise<Locator> {
    return findResilient(this.page, {
      ...def,
      reporter: this.reporter
    });
  }

  async expectOnRecoveryPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/passwordrecovery(?:\?|$)/);
    await expect(
      this.page.locator('input.password-recovery-button')
    ).toBeVisible();
  }

  async recoverPassword(email: string): Promise<void> {
    const emailInput = await this.locate({
      name: 'Password recovery email',
      primary: { type: 'id', value: 'Email' } as LocatorStrategy,
      fallbacks: [
        { type: 'name', value: 'Email' },
        { type: 'css', value: '.form-fields input.email' },
        { type: 'label', name: 'Your email address:' }
      ] as LocatorStrategy[]
    });

    const recoverButton = await this.locate({
      name: 'Recover password button',
      primary: {
        type: 'css',
        value: 'input.password-recovery-button[name="send-email"]'
      } as LocatorStrategy,
      fallbacks: [
        {
          type: 'css',
          value: 'input[type="submit"][value="Recover"]'
        },
        { type: 'role', role: 'button', name: 'Recover' }
      ] as LocatorStrategy[]
    });

    this.log.info('Submitting password recovery request', { email });
    await emailInput.fill(email);
    await recoverButton.click();
  }

  async expectRecoveryFeedback(): Promise<void> {
    const feedback = this.page.locator(
      '.result, .validation-summary-errors, .field-validation-error, .message-error'
    ).filter({ hasText: /\S/ }).first();

    await expect(feedback).toBeVisible({ timeout: defaultTimeout });
  }
}
