import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from '@playwright/test';
import { RegisterPage, RegistrationUser } from '../../src/pages/register.page';
import { LoginPage } from '../../src/pages/login.page';
import { HomePage } from '../../src/pages/home.page';
import { HealingReporter } from '../../src/resilience/healing-reporter';

export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  registerPage!: RegisterPage;
  loginPage!: LoginPage;
  homePage!: HomePage;
  healingReporter = new HealingReporter();
  scenarioId = '';

  /** The user resolved for the current scenario (kept so the confirm password and later steps can reuse it). */
  currentUser?: RegistrationUser;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(CustomWorld);