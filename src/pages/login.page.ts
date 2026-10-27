
import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import type { HealingReporter } from '../resilience/healing-reporter';
import type { LocatorStrategy } from '../resilience/resilient-locator';
import { findResilient } from '../resilience/resilient-locator';
import { Logger } from '../../utils/logger';

const defaultTimeout = 10_000;

export class LoginPage {
  private readonly log = Logger.for('LoginPage');
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

  private readonly emailField = {
    name: 'Login email',
    primary: { type: 'id', value: 'Email-2' } as LocatorStrategy,
    fallbacks: [
      { type: 'name', value: 'Email' },
      { type: 'css', value: 'input.email' },
      { type: 'label', name: 'Email:' }
    ] as LocatorStrategy[]
  };

  private readonly passwordField = {
    name: 'Login password',
    primary: { type: 'id', value: 'Password' } as LocatorStrategy,
    fallbacks: [
      { type: 'name', value: 'Password' },
      { type: 'css', value: 'input.password' },
      { type: 'label', name: 'Password:' }
    ] as LocatorStrategy[]
  };

  private readonly rememberMeField = {
    name: 'Remember me',
    primary: { type: 'id', value: 'RememberMe' } as LocatorStrategy,
    fallbacks: [
      { type: 'name', value: 'RememberMe' },
      { type: 'css', value: 'input[type="checkbox"][value="true"]' },
      { type: 'label', name: 'Remember me' }
    ] as LocatorStrategy[]
  };

  async open(): Promise<void> {
    this.log.info('Opening login page');
    await this.page.goto(new URL('/login', this.page.url()).toString());
    await this.expectOnLoginPage();
  }

  async openFromHeader(): Promise<void> {
    const loginLink = await this.locate({
      name: 'Header login link',
      primary: {
        type: 'css',
        value: '.header-links a.ico-login[href="/login"]'
      },
      fallbacks: [
        { type: 'css', value: 'a.ico-login[href="/login"]' },
        { type: 'role', role: 'link', name: 'Log in' }
      ]
    });

    this.log.info('Opening login form from the header');
    await loginLink.click();
    await this.expectOnLoginPage();
  }

  async expectOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login(?:\?|$)/);
    await expect(
      this.page.getByRole('button', { name: 'Log in' })
        .or(this.page.locator('input.login-button'))
    ).toBeVisible();
  }
  

  async fillCredentials(email: string, password: string): Promise<void> {
    const emailInput = await this.locate(this.emailField);
    const passwordInput = await this.locate(this.passwordField);

    // Clear any browser-autofilled or previously entered values.
    await emailInput.clear();
    await passwordInput.clear();

    this.log.info('Entering login email', { email });
    await emailInput.fill(email);
    await expect(emailInput).toHaveValue(email);

    this.log.info('Entering login password');
    await passwordInput.fill(password);
    await expect(passwordInput).toHaveValue(password);

    this.log.info('Login credentials filled successfully');
  }


  async setRememberMe(remember: boolean): Promise<void> {
    const checkbox = await this.locate(this.rememberMeField);

    if (remember) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  async submit(): Promise<void> {
    const button = await this.locate({
      name: 'Login submit button',
      primary: {
        type: 'css',
        value: 'input.login-button[type="submit"]'
      },
      fallbacks: [
        { type: 'css', value: 'input[type="submit"][value="Log in"]' },
        { type: 'role', role: 'button', name: 'Log in' }
      ]
    });

    this.log.info('Submitting login form');
    await button.click();
  }

  async login(
    email: string,
    password: string,
    remember = false
  ): Promise<void> {
    await this.fillCredentials(email, password);
    await this.setRememberMe(remember);
    await this.submit();
  }

  async expectLoggedInAs(email: string): Promise<void> {
    this.log.info('Verifying logged-in account', { email });

    const accountLink = this.page.locator(
      '.header-links a.account[href="/customer/info"]'
    );

    await expect(accountLink).toBeVisible({ timeout: 15_000 });
    await expect(accountLink).toHaveText(email);
    await expect(this.page).toHaveURL(/demowebshop\.tricentis\.com\/?(?:\?.*)?$/);
  }

  async expectLoginRejected(): Promise<void> {
    const error = this.page.locator(
      '.validation-summary-errors, .message-error, .field-validation-error'
    ).filter({ hasText: /\S/ }).first();

    await expect(error).toBeVisible({ timeout: defaultTimeout });
  }

  async openPasswordRecovery(): Promise<void> {
    const recoveryLink = await this.locate({
      name: 'Forgot password link',
      primary: {
        type: 'css',
        value: 'a[href="/passwordrecovery"]'
      },
      fallbacks: [
        { type: 'role', role: 'link', name: 'Forgot password?' }
      ]
    });

    await recoveryLink.click();
    await expect(this.page).toHaveURL(/\/passwordrecovery(?:\?|$)/);
  }
}
