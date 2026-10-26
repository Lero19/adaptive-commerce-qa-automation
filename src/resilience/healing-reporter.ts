import fs from 'node:fs';
import path from 'node:path';

export interface HealingEvent {
  target: string;
  strategy: string;
  outcome: 'healed' | 'not-found' | 'ambiguous' | 'not-usable';
  fallbackIndex: number;
  timestamp?: string;
}

export class HealingReporter {
  private readonly events: HealingEvent[] = [];

  record(event: HealingEvent): void {
    this.events.push({ ...event, timestamp: new Date().toISOString() });
  }

  getEvents(): readonly HealingEvent[] {
    return this.events;
  }

  write(filePath: string): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify({
      eventCount: this.events.length,
      healedCount: this.events.filter(event => event.outcome === 'healed').length,
      events: this.events
    }, null, 2));
  }
}
