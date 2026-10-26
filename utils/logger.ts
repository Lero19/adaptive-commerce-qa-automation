import * as fs from 'node:fs';
import * as path from 'node:path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const COLOURS: Record<LogLevel, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m'
};
const RESET = '\x1b[0m';

/**
 * Small framework logger.
 *  - LOG_LEVEL=debug|info|warn|error (default: info)
 *  - LOG_DIR=<folder> (default: ./logs) -> every line is appended to <LOG_DIR>/test-run.log
 *  - Lines are also buffered per scenario so the After hook can attach them to the Allure report.
 *
 * Usage:  private readonly log = Logger.for('RegisterPage');
 *         this.log.info('Submitting registration form', { email });
 */
export class Logger {
  private static scenarioBuffer: string[] = [];
  private static logFile: string | undefined;

  private constructor(private readonly context: string) {}

  static for(context: string): Logger {
    return new Logger(context);
  }

  /** Call from a Before hook so each scenario gets its own log attachment. */
  static startScenario(name: string): void {
    Logger.scenarioBuffer = [];
    Logger.for('Scenario').info(`START: ${name}`);
  }

  /** Returns everything logged since startScenario() and clears the buffer. */
  static drainScenarioLog(): string {
    const text = Logger.scenarioBuffer.join('\n');
    Logger.scenarioBuffer = [];
    return text;
  }

  debug(message: string, meta?: unknown): void {
    this.write('debug', message, meta);
  }

  info(message: string, meta?: unknown): void {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: unknown): void {
    this.write('warn', message, meta);
  }

  error(message: string, meta?: unknown): void {
    this.write('error', message, meta);
  }

  private write(level: LogLevel, message: string, meta?: unknown): void {
    const threshold = (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info';
    if (LEVEL_ORDER[level] < (LEVEL_ORDER[threshold] ?? LEVEL_ORDER.info)) {
      return;
    }

    const metaText = meta === undefined ? '' : ` ${JSON.stringify(meta)}`;
    const line = `${Logger.timestamp()} [${level.toUpperCase().padEnd(5)}] [${this.context}] ${message}${metaText}`;

    Logger.scenarioBuffer.push(line);
    console.log(`${COLOURS[level]}${line}${RESET}`);
    Logger.appendToFile(line);
  }

  /** Local time with milliseconds, e.g. 2026-10-26 16:03:12.345 */
  private static timestamp(): string {
    const d = new Date();
    const pad = (n: number, len = 2): string => String(n).padStart(len, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
      + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
  }

  private static appendToFile(line: string): void {
    try {
      if (!Logger.logFile) {
        const dir = path.resolve(process.env.LOG_DIR ?? 'logs');
        fs.mkdirSync(dir, { recursive: true });
        Logger.logFile = path.join(dir, 'test-run.log');
      }
      fs.appendFileSync(Logger.logFile, `${line}\n`);
    } catch {
      // Logging must never break a test run.
    }
  }
}