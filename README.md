# Adaptive Commerce QA Framework

A public portfolio project demonstrating Playwright, TypeScript, Cucumber BDD, Page Object Model, controlled locator fallback, diagnostic artifacts, and CI.

**Target application:** https://demowebshop.tricentis.com

> This is a learning and portfolio framework. The public demo site's DOM, validation behavior, rate limits, and availability may change. Verify selectors and behavior against the live site before relying on the suite.

## Features

- Cucumber/Gherkin scenarios separated from step definitions and page objects.
- Scenario-scoped browser contexts to avoid session leakage between scenarios.
- Data generation for unique registration emails.
- Controlled locator fallback with uniqueness, visibility, and enabled checks.
- JSON healing telemetry that records successful fallback events and candidate failures.
- Failure screenshot attachment and trace artifact hooks.
- GitHub Actions workflow for type-checking and smoke tests.

## Prerequisites

- Node.js 20+ (CI uses Node 22)
- npm
- Git

## Quick start

```bash
npm install
npx playwright install chromium
cp .env.example .env
npm run typecheck
npm run test:smoke
```

On Windows PowerShell, copy the environment template with:

```powershell
Copy-Item .env.example .env
```

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | Demo Web Shop URL | Base URL for tests |
| `HEADLESS` | `true` | Run browser headlessly |
| `BROWSER` | `chromium` | `chromium`, `firefox`, or `webkit` |
| `DEFAULT_TIMEOUT_MS` | `10000` | Playwright default timeout |

Do not commit `.env`, credentials, real customer data, or authentication state.

## Architecture

```text
Gherkin features
      |
Cucumber step definitions + scenario World/hooks
      |
Page Object Model + reusable components
      |
Resilient locator policy ---- Healing telemetry
      |
Playwright browser/context/page
      |
Screenshots, traces, Cucumber JSON, CI artifacts
```

## Self-healing scope and limitations

The included `findResilient` helper implements **controlled fallback resolution**, not AI-based locator generation. It tries explicitly configured strategies in order and accepts a candidate only when it uniquely identifies a visible and enabled element.

A fallback is not automatically a successful test: the intended business assertion must still pass. Ambiguous candidates are rejected, and exhausted strategies throw an error. Review the JSON telemetry before making any claim about healing rate.

For a portfolio demonstration, add a dedicated fixture or local test page where the primary selector is deliberately changed and the fallback remains valid. Do not intentionally modify the public demo site.

## Diagnostics

- Cucumber JSON report: `reports/cucumber-report.json`
- Healing event JSON: `reports/*-healing.json`
- Failure screenshots: attached to Cucumber output
- Trace artifacts: `test-results/<scenario>/trace.zip` when tracing is enabled

Tracing is started for each scenario context; failed scenarios save `trace.zip` under `test-results/<scenario>/`.

## Current scope

The starter includes registration happy-path and negative scenarios. It does not yet include a complete login/cart/checkout suite, autonomous AI locator generation, API-based setup, or a guaranteed passing result against every future version of the public demo site. Confirm the live page's accessible labels and validation messages, then expand in small, independently testable slices.

## Portfolio roadmap

1. Make the registration feature stable against the current DOM.
2. Add unit tests for locator resolution: missing primary, valid fallback, ambiguous fallback, disabled target.
3. Add a deliberate locator-drift demonstration on a local fixture.
4. Add login, product search, cart, and checkout scenarios.
5. Add CI matrix runs and publish sanitized reports.
6. Document run duration, pass rate, failure categories, and fallback recovery rate using actual runs.

## Suggested LinkedIn demo

Show the architecture, one readable Gherkin scenario, a short browser run, and a real healing event from the report. Distinguish fallback recovery from AI-generated locators and publish only metrics collected from real executions.


## Branching Strategy

- `main`: Development and QA automation changes.
- `demowebshop.prod`: Production-approved automation code.
- Pull requests are used to promote changes from `main` to `demowebshop.prod`.

## Test Automation Stack

- Playwright
- TypeScript
- Cucumber.js
- Allure Reports

## Test Execution

Run the project's configured test command to execute the automated test suite.

Generate an Allure report after test execution using:

```powershell
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
