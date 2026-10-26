import { Page } from '@playwright/test';
import { environment } from '../../config/environment';
import { HealingReporter } from '../resilience/healing-reporter';

export class LoginPage {
  constructor(
    private readonly page: Page,
    // Reserved for consistent resilience policy across page objects.
    private readonly reporter: HealingReporter
  ) {}

  async navigate(): Promise<void> {
    await this.page.goto(new URL('/login', environment.baseUrl).toString());
  }
}
