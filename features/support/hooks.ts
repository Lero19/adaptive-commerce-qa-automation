import { Before, After, BeforeAll, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, firefox, webkit, BrowserType } from '@playwright/test';
import { environment } from '../../config/environment';
import { CustomWorld } from './world';
const { RegisterPage } = require('../../src/pages/register.page');
const { LoginPage } = require('../../src/pages/login.page');
const { HomePage } = require('../../src/pages/home.page');
const { PasswordRecoveryPage } = require('../../src/pages/password-recovery-page');
import fs from 'node:fs';
import path from 'node:path';

setDefaultTimeout(45_000);

const browserTypes: Record<string, BrowserType> = { chromium, firefox, webkit };
let sharedBrowser: Awaited<ReturnType<BrowserType['launch']>>;

BeforeAll(async function () {
  fs.mkdirSync('reports', { recursive: true });
  const type = browserTypes[environment.browser];
  if (!type) throw new Error(`Unsupported BROWSER "${environment.browser}". Use chromium, firefox, or webkit.`);
  sharedBrowser = await type.launch({ headless: environment.headless, 
    args: ['--start-maximized']});
});

Before(async function (this: CustomWorld, scenario) {
  this.scenarioId = scenario.pickle.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  this.browser = sharedBrowser;
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
  this.page.setDefaultTimeout(environment.defaultTimeoutMs);
  await this.context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  this.registerPage = new RegisterPage(this.page, this.healingReporter);
  this.loginPage = new LoginPage(this.page, this.healingReporter);
  this.homePage = new HomePage(this.page, this.healingReporter);
  this.passwordRecoveryPage = new PasswordRecoveryPage(this.page, this.healingReporter);
});


After(async function (this: CustomWorld, scenario) {
  const dir = path.join(
    'test-results',
    this.scenarioId || 'unknown'
  );

  try {
    if (this.page) {
      fs.mkdirSync(dir, { recursive: true });

      // Capture the final browser state for both passed and failed tests.
      const screenshot = await this.page
        .screenshot({
          fullPage: true,
          animations: 'disabled'
        })
        .catch((error) => {
          console.error('Screenshot capture failed:', error);
          return undefined;
        });

      if (screenshot) {
        // Attach the screenshot to the Cucumber result for Allure.
        await this.attach(screenshot, 'image/png');

        // Save a copy locally as well.
        fs.writeFileSync(
          path.join(dir, 'final.png'),
          screenshot
        );
      }

      // Preserve traces for failed scenarios.
      if (scenario.result?.status === 'FAILED') {
        const tracePath = path.join(dir, 'trace.zip');

        await this.context?.tracing
          .stop({ path: tracePath })
          .catch((error) => {
            console.error('Trace capture failed:', error);
          });

        if (fs.existsSync(tracePath)) {
          await this.attach(
            fs.readFileSync(tracePath),
            'application/zip'
          );
        }
      } else {
        await this.context?.tracing.stop().catch((error) => {
          console.error('Tracing shutdown failed:', error);
        });
      }
    }
  } finally {
    try {
      this.healingReporter.write(
        path.join(
          'reports',
          `${this.scenarioId || 'scenario'}-healing.json`
        )
      );
    } finally {
      await this.context?.close();
    }
  }
});


AfterAll(async function () {
  await sharedBrowser?.close();
});
