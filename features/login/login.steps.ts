import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { environment } from '../../config/environment';
import { PasswordRecoveryPage } from '../../src/pages/password-recovery-page';

function validateCredentials(): void {
  if (!environment.email || !environment.password) {
    throw new Error(
      'Configure TEST_USER_EMAIL and TEST_USER_PASSWORD before running authentication tests.'
    );
  }
}

When(
  'I open the login form from the header',
  async function (this: CustomWorld) {
    await this.loginPage.openFromHeader();
  }
);

When(
  'I authenticate using a registered customer\'s {string} and valid password',
  async function (this: CustomWorld, credentialType: string) {
    validateCredentials();

    if (credentialType !== 'email') {
      throw new Error(`Unsupported login credential type: ${credentialType}`);
    }

    await this.loginPage.login(
      environment.email,
      environment.password
    );
  }
);

Then(
  'access to the customer account should be granted',
  async function (this: CustomWorld) {
    await this.loginPage.expectLoggedInAs(environment.email);
  }
);

Then(
  'the authenticated customer\'s identity should be displayed in the header',
  async function (this: CustomWorld) {
    await expect(
      this.page.locator('.header-links a.account[href="/customer/info"]')
    ).toHaveText(environment.email);
  }
);

When(
  'I attempt to authenticate using my configured email and password {string}',
  async function (this: CustomWorld, password: string) {
    validateCredentials();

    await this.loginPage.login(environment.email, password);
  }
);

Then(
  'access to the customer account should be denied',
  async function (this: CustomWorld) {
    await this.loginPage.expectLoginRejected();
  }
);

Then(
  'an appropriate authentication error should be displayed',
  async function (this: CustomWorld) {
    await expect(this.page.locator('.message-error'))
      .toContainText('Login was unsuccessful');
  }
);

Then(
  'the customer should remain unauthenticated',
  async function (this: CustomWorld) {
    await expect(
      this.page.locator('.header-links a.account[href="/customer/info"]')
    ).toHaveCount(0);
  }
);

When(
  'I open the password recovery form',
  async function (this: CustomWorld) {
    await this.loginPage.openFromHeader();
    await this.loginPage.openPasswordRecovery();
    await this.passwordRecoveryPage.expectOnRecoveryPage();
  }
);
When(
  'I open the forgot password form',
  async function (this: CustomWorld) {
    await this.loginPage.openPasswordRecovery();
  }
);

Then(
  'the password recovery form should be displayed',
  async function (this: CustomWorld) {
    await this.passwordRecoveryPage.expectOnRecoveryPage();
  }
);

Then(
  'the customer should be able to provide their registered email address',
  async function (this: CustomWorld) {
    await expect(this.page.locator('#Email')).toBeVisible();
  }
);

When(
  'I submit my configured test email address for password recovery',
  async function (this: CustomWorld) {
    if (!environment.email) {
      throw new Error(
        'Configure TEST_USER_EMAIL before running password recovery tests.'
      );
    }

    await this.passwordRecoveryPage.recoverPassword(environment.email);
  }
);

Then(
  'the password recovery request should be acknowledged',
  async function (this: CustomWorld) {
    await this.passwordRecoveryPage.expectRecoveryFeedback();
  }
);

Then(
  'the customer should receive appropriate next-step guidance',
  async function (this: CustomWorld) {
    await this.passwordRecoveryPage.expectRecoveryFeedback();
  }
);