import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { resolveUser } from '../../src/data/user-factory';

Given('I am on the web shop home page', async function (this: CustomWorld) {
  await this.homePage.navigate();
});

When('I open the registration form from the header', async function (this: CustomWorld) {
  await this.homePage.clickRegister();
  await this.registerPage.expectOnRegistrationPage();
});

When(
  'I register as a {string} customer named {string} {string} with email {string}, password {string} and confirm password {string}',
  async function (
    this: CustomWorld,
    gender: string,
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    confirmPassword: string
  ) {
    // Random values are generated here, once, so confirm password can reuse the generated password.
    this.currentUser = resolveUser({ gender, firstName, lastName, email, password, confirmPassword });
    await this.registerPage.register(this.currentUser);
  }
);

Then('my registration should complete successfully', async function (this: CustomWorld) {
  await this.registerPage.expectSuccessfulRegistration();
});

Then('I should be logged in with my new account', async function (this: CustomWorld) {
  expect(this.currentUser, 'a customer must have been registered first').toBeDefined();
  await this.homePage.expectLoggedInAs(this.currentUser!.email);
});

Then('the registration should be rejected with validation feedback', async function (this: CustomWorld) {
  await expect(this.registerPage.validationFeedback()).toBeVisible();
});

Then('I should see the validation message {string}', async function (this: CustomWorld, message: string) {
  await this.registerPage.expectValidationMessage(message);
});