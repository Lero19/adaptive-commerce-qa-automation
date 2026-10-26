import { Locator, Page } from '@playwright/test';
import { HealingReporter } from './healing-reporter';
import { Logger } from '../../utils/logger';

const log = Logger.for('ResilientLocator');

/**
 * Strategies are tried in the order given. Convention: ID first (most stable),
 * then name/css, then user-facing locators (label/role/text) as fallbacks.
 */
export type LocatorStrategy =
  | { type: 'id'; value: string }
  | { type: 'name'; value: string }
  | { type: 'css'; value: string }
  | { type: 'role'; role: 'button' | 'link' | 'textbox' | 'checkbox' | 'radio'; name: string }
  | { type: 'label'; name: string }
  | { type: 'placeholder'; value: string }
  | { type: 'testId'; value: string }
  | { type: 'text'; value: string };

export interface ResilientLocatorDefinition {
  name: string;
  primary: LocatorStrategy;
  fallbacks: LocatorStrategy[];
  reporter: HealingReporter;
}

function resolve(page: Page, strategy: LocatorStrategy): Locator {
  switch (strategy.type) {
    case 'id':
      return page.locator(`[id="${strategy.value}"]`);
    case 'name':
      return page.locator(`[name="${strategy.value}"]`);
    case 'css':
      return page.locator(strategy.value);
    case 'role':
      return page.getByRole(strategy.role, { name: strategy.name, exact: true });
    case 'label':
      return page.getByLabel(strategy.name, { exact: true });
    case 'placeholder':
      return page.getByPlaceholder(strategy.value, { exact: true });
    case 'testId':
      return page.getByTestId(strategy.value);
    case 'text':
      return page.getByText(strategy.value, { exact: true });
  }
}

/**
 * Controlled fallback resolution, not autonomous AI locator generation.
 * A fallback is accepted only if it uniquely identifies a visible, enabled element.
 */
export async function findResilient(
  page: Page,
  definition: ResilientLocatorDefinition
): Promise<Locator> {
  const strategies = [definition.primary, ...definition.fallbacks];

  for (let index = 0; index < strategies.length; index += 1) {
    const strategy = strategies[index];
    const candidate = resolve(page, strategy);
    const count = await candidate.count().catch(() => 0);

    if (count !== 1) {
      log.warn(`"${definition.name}" via ${strategy.type}: ${count > 1 ? 'ambiguous' : 'not found'} (count=${count}), trying next strategy`);
      definition.reporter.record({
        target: definition.name,
        strategy: strategy.type,
        outcome: count > 1 ? 'ambiguous' : 'not-found',
        fallbackIndex: index
      });
      continue;
    }

    const usable = (await candidate.isVisible().catch(() => false))
      && (await candidate.isEnabled().catch(() => false));

    if (!usable) {
      log.warn(`"${definition.name}" via ${strategy.type}: found but not visible/enabled, trying next strategy`);
      definition.reporter.record({
        target: definition.name,
        strategy: strategy.type,
        outcome: 'not-usable',
        fallbackIndex: index
      });
      continue;
    }

    if (index > 0) {
      log.warn(`"${definition.name}" HEALED: primary failed, resolved via fallback #${index} (${strategy.type})`);
      definition.reporter.record({
        target: definition.name,
        strategy: strategy.type,
        outcome: 'healed',
        fallbackIndex: index
      });
    } else {
      log.debug(`"${definition.name}" resolved via primary (${strategy.type})`);
    }
    return candidate;
  }

  log.error(`"${definition.name}" could not be resolved by any of ${strategies.length} strategies`);
  throw new Error(`No unique, visible and enabled locator found for "${definition.name}".`);
}