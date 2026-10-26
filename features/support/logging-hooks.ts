import { Before, After, Status } from '@cucumber/cucumber';
import { CustomWorld } from './world';
import { Logger } from '../../utils/logger';

const log = Logger.for('Hooks');

Before(async function (this: CustomWorld, { pickle }) {
  Logger.startScenario(pickle.name);
});

After(async function (this: CustomWorld, { pickle, result }) {
  const failed = result?.status === Status.FAILED;
  log.info(`${failed ? 'FAILED' : 'END'}: ${pickle.name}`, { status: result?.status });
  if (failed && result?.message) {
    // Surfaces the real error in the console even when the progress formatter hides it.
    log.error(`Reason: ${result.message.split('\n').slice(0, 6).join(' | ')}`);
  }

  // Screenshot on failure -> shows up in the Allure report (this.attach is picked up by allure-cucumberjs).
  if (failed) {
    try {
      if (this.page && !this.page.isClosed()) {
        const screenshot = await this.page.screenshot({ fullPage: true });
        this.attach(screenshot, 'image/png');
        log.error('Screenshot captured for failed scenario', { url: this.page.url() });
      }
    } catch (error) {
      log.warn('Could not capture failure screenshot', { error: String(error) });
    }
  }

  // Attach the scenario's log lines to the Allure report.
  this.attach(Logger.drainScenarioLog(), 'text/plain');
});