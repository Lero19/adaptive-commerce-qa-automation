import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import type { HealingReporter } from '../../src/resilience/healing-reporter';
import type { LocatorStrategy } from '../../src/resilience/resilient-locator';
import { findResilient } from '../../src/resilience/resilient-locator';
import { Logger } from '../../utils/logger';

const defaultTimeout = 10_000;
const medium_timeout = 15_000;

export type Gender = 'male' | 'female';

export interface RegistrationUser {
  gender?: Gender;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Locator definitions live in one place: ID first, then progressively weaker fallbacks. */
const FIELDS = {
  firstName: {
    name: 'First name',
    primary: { type: 'id', value: 'FirstName' } as LocatorStrategy,
    fallbacks: [
      { type: 'name', value: 'FirstName' },
      { type: 'label', name: 'First name:' }
    ] as LocatorStrategy[]
  },
  lastName: {
    name: 'Last name',
    primary: { type: 'id', value: 'LastName' } as LocatorStrategy,
    fallbacks: [
      { type: 'name', value: 'LastName' },
      { type: 'label', name: 'Last name:' }
    ] as LocatorStrategy[]
  },
  email: {
    name: 'Email',
    primary: { type: 'id', value: 'Email' } as LocatorStrategy,
    fallbacks: [
      { type: 'name', value: 'Email' },
      { type: 'label', name: 'Email:' }
    ] as LocatorStrategy[]
  },
  password: {
    name: 'Password',
    primary: { type: 'id', value: 'Password' } as LocatorStrategy,
    fallbacks: [
      { type: 'name', value: 'Password' },
      { type: 'label', name: 'Password:' }
    ] as LocatorStrategy[]
  },
  confirmPassword: {
    name: 'Confirm password',
    primary: { type: 'id', value: 'ConfirmPassword' } as LocatorStrategy,
    fallbacks: [
      { type: 'name', value: 'ConfirmPassword' },
      { type: 'label', name: 'Confirm password:' }
    ] as LocatorStrategy[]
  }
} as const;

const GENDER = {
  male: {
    name: 'Gender: Male',
    primary: { type: 'id', value: 'gender-male' } as LocatorStrategy,
    fallbacks: [
      { type: 'css', value: 'input[name="Gender"][value="M"]' },
      { type: 'role', role: 'radio', name: 'Male' }
    ] as LocatorStrategy[]
  },
  female: {
    name: 'Gender: Female',
    primary: { type: 'id', value: 'gender-female' } as LocatorStrategy,
    fallbacks: [
      { type: 'css', value: 'input[name="Gender"][value="F"]' },
      { type: 'role', role: 'radio', name: 'Female' }
    ] as LocatorStrategy[]
  }
} as const;

export class RegisterPage {
  private readonly log = Logger.for('RegisterPage');
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
    return findResilient(this.page, { ...def, reporter: this.reporter });
  }

  async expectOnRegistrationPage(): Promise<void> {
    this.log.info('Verifying the registration page is displayed');
    await expect(this.page).toHaveURL(/\/register/);
    await expect(this.page.locator('.page-title h1')).toHaveText('Register');
    this.log.info('Registration page is displayed', { url: this.page.url() });
  }

  /** Empty values are skipped so the same method drives positive and negative scenarios. */
  async fillForm(user: RegistrationUser): Promise<void> {
    if (user.gender) {
      this.log.info(`Selecting gender: ${user.gender}`);
      await (await this.locate(GENDER[user.gender])).check();
    } else {
      this.log.info('No gender selected (optional field)');
    }

    // [field key, human-readable label for the log, value, mask the value in logs?]
    const text: Array<[keyof typeof FIELDS, string, string, boolean]> = [
      ['firstName', 'first name', user.firstName, false],
      ['lastName', 'last name', user.lastName, false],
      ['email', 'email', user.email, false],
      ['password', 'password', user.password, true],
      ['confirmPassword', 'confirm password', user.confirmPassword, true]
    ];
    for (const [key, label, value, mask] of text) {
      if (value === '') {
        this.log.info(`Leaving ${label} blank`);
        continue;
      }
      this.log.info(`Entering ${label}: ${mask ? '*'.repeat(value.length) : value}`);
      await (await this.locate(FIELDS[key])).fill(value);
    }
  }

  async submit(): Promise<void> {
    const button = await this.locate({
      name: 'Register submit button',
      primary: { type: 'id', value: 'register-button' },
      fallbacks: [
        { type: 'css', value: 'input.register-next-step-button' },
        { type: 'name', value: 'register-button' },
        { type: 'role', role: 'button', name: 'Register' }
      ]
    });
    this.log.info('Clicking the Register button');
    await button.click();
  }

  async register(user: RegistrationUser): Promise<void> {
    this.log.info('Registering a new customer', { gender: user.gender ?? 'none', email: user.email });
    await this.fillForm(user);
    await this.submit();
  }

  async expectSuccessfulRegistration(): Promise<void> {
    this.log.info('Verifying the "Your registration completed" message');
    await expect(this.page.locator('.result'))
      .toContainText('Your registration completed', { timeout: medium_timeout });
    this.log.info('Registration completed successfully');
  }
  
  validationFeedback(): Locator {
    return this.page.locator(
      '.field-validation-error, .validation-summary-errors, .message-error'
    ).filter({ hasText: /\S/ }).first();
  }
    
  async expectValidationMessage(message: string): Promise<void> {
    this.log.info(`Verifying validation message: "${message}"`);

    const fieldByMessage: Record<string, string> = {
      'First name is required.':
        '[data-valmsg-for="FirstName"]',
      'Last name is required.':
        '[data-valmsg-for="LastName"]',
      'Email is required.':
        '[data-valmsg-for="Email"]',
      'Password is required.':
        '[data-valmsg-for="Password"]',
      'The password and confirmation password do not match.':
        '.field-validation-error, .validation-summary-errors'
    };

    const selector = fieldByMessage[message];

    if (
      message ===
      'The password and confirmation password do not match.'
    ) {
      const error = this.page
        .locator('.field-validation-error, .validation-summary-errors, .message-error')
        .filter({ hasText: message })
        .first();

      await expect(error).toBeVisible({ timeout: defaultTimeout });
      await expect(error).toContainText(message);
    } else if (selector) {
      const error = this.page.locator(selector);
      await expect(error).toBeVisible({ timeout: defaultTimeout });
      await expect(error).toContainText(message);
    } else {
      throw new Error(`No validation selector configured for: "${message}"`);
    }
    await expect(this.page).toHaveURL(/\/register/);
    this.log.info(`Validation message verified: "${message}"`);
  }

}