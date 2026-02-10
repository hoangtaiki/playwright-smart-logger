import { test as base, TestInfo, Page } from '@playwright/test';
import chalk from 'chalk';

// Type augmentation for Playwright configuration
declare module '@playwright/test' {
  interface PlaywrightTestOptions {
    smartLog?: SmartLogOptions;
  }

  interface PlaywrightWorkerOptions {
    smartLog?: SmartLogOptions;
  }
}

// Types for configuration and log entries
export type FlushOn = 'fail' | 'pass' | 'skip' | 'fixme' | 'retry' | 'timeout';

export interface SmartLogOptions {
  /** When to flush logs (default: ['fail', 'retry']) */
  flushOn?: FlushOn[];
  /** Maximum number of log entries to keep in buffer (default: 1000) */
  maxBufferSize?: number;
  /** Capture browser console logs via page.on('console') (default: false) */
  capturePageConsole?: boolean;
}

export type LogLevel = 'log' | 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  args: any[];
  timestamp: number;
  source: 'test' | 'browser';
  groupLevel: number;
}

export interface SmartLogFixture {
  /** General purpose logging */
  log(...args: any[]): void;
  /** Debug level logging */
  debug(...args: any[]): void;
  /** Info level logging */
  info(...args: any[]): void;
  /** Warning level logging */
  warn(...args: any[]): void;
  /** Error level logging */
  error(...args: any[]): void;
  /** Start a new group (increases indentation) */
  group(...args: any[]): void;
  /** End the current group (decreases indentation) */
  groupEnd(): void;
  /** Log structured data as a table */
  table(data: any, columns?: string[]): void;
  /** Log an object with formatting */
  dir(obj: any): void;
  /** Start a timer */
  time(label?: string): void;
  /** Stop a timer and log the elapsed time */
  timeEnd(label?: string): void;
  /** Log the current value of a timer without stopping it */
  timeLog(label?: string, ...args: any[]): void;
  /** Log an error if the assertion is false */
  assert(condition?: boolean, ...args: any[]): void;
  /** Increment and log a counter */
  count(label?: string): void;
  /** Reset a counter */
  countReset(label?: string): void;
  /** Log a stack trace */
  trace(...args: any[]): void;
  /** Clear the log buffer and reset group depth */
  clear(): void;
  /** Get current buffer contents */
  getBuffer(): LogEntry[];
  /** Manually flush logs to console and report */
  flush(): Promise<void>;
}

/**
 * Safely stringify a value, handling circular references.
 */
function safeStringify(obj: any, indent: number = 2): string {
  const seen = new WeakSet();
  try {
    return JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }, indent);
  } catch {
    return String(obj);
  }
}

/**
 * Format a single argument for display.
 */
function formatArg(arg: any): string {
  if (arg === undefined) return 'undefined';
  if (arg === null) return 'null';
  if (typeof arg === 'string') return arg;
  if (typeof arg === 'symbol') return arg.toString();
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
  if (typeof arg === 'object') return safeStringify(arg);
  return String(arg);
}

class SmartLogger {
  private buffer: LogEntry[] = [];
  private timers: Map<string, number> = new Map();
  private counters: Map<string, number> = new Map();
  private groupDepth: number = 0;
  private pageConsoleListener?: (msg: any) => void;

  constructor(
    private testInfo: TestInfo,
    private page: Page | undefined,
    private options: Required<SmartLogOptions>
  ) {
    this.setupBrowserConsoleCapture();
  }

  private setupBrowserConsoleCapture(): void {
    if (!this.options.capturePageConsole || !this.page) {
      return;
    }

    this.pageConsoleListener = (msg) => {
      try {
        const level = this.mapBrowserLogLevel(msg.type());
        const args = msg.args().map((arg: any) => {
          try {
            return arg.toString();
          } catch {
            return '[object]';
          }
        });

        this.addLogEntry(level, args, 'browser');
      } catch {
        // Silently ignore browser console capture errors
      }
    };

    this.page.on('console', this.pageConsoleListener);
  }

  private mapBrowserLogLevel(type: string): LogLevel {
    switch (type) {
      case 'log': return 'log';
      case 'debug': return 'debug';
      case 'info': return 'info';
      case 'warning': return 'warn';
      case 'error': return 'error';
      default: return 'log';
    }
  }

  private addLogEntry(level: LogLevel, args: any[], source: 'test' | 'browser' = 'test'): void {
    const entry: LogEntry = {
      level,
      args: [...args],
      timestamp: Date.now(),
      source,
      groupLevel: this.groupDepth,
    };

    this.buffer.push(entry);

    // Trim buffer if it exceeds maxBufferSize
    if (this.buffer.length > this.options.maxBufferSize) {
      this.buffer = this.buffer.slice(-this.options.maxBufferSize);
    }
  }

  // --- Core logging methods ---

  public log(...args: any[]): void {
    this.addLogEntry('log', args);
  }

  public debug(...args: any[]): void {
    this.addLogEntry('debug', args);
  }

  public info(...args: any[]): void {
    this.addLogEntry('info', args);
  }

  public warn(...args: any[]): void {
    this.addLogEntry('warn', args);
  }

  public error(...args: any[]): void {
    this.addLogEntry('error', args);
  }

  // --- Grouping ---

  public group(...args: any[]): void {
    this.addLogEntry('log', args.length > 0 ? args : ['']);
    this.groupDepth++;
  }

  public groupEnd(): void {
    if (this.groupDepth > 0) {
      this.groupDepth--;
    }
  }

  // --- Structured data ---

  public table(data: any, columns?: string[]): void {
    const entry: LogEntry = {
      level: 'log',
      args: columns ? [data, { __tableColumns: columns }] : [data],
      timestamp: Date.now(),
      source: 'test',
      groupLevel: this.groupDepth,
    };
    // Mark this entry as a table for formatting
    (entry as any).__isTable = true;
    this.buffer.push(entry);

    if (this.buffer.length > this.options.maxBufferSize) {
      this.buffer = this.buffer.slice(-this.options.maxBufferSize);
    }
  }

  public dir(obj: any): void {
    const entry: LogEntry = {
      level: 'log',
      args: [obj],
      timestamp: Date.now(),
      source: 'test',
      groupLevel: this.groupDepth,
    };
    (entry as any).__isDir = true;
    this.buffer.push(entry);

    if (this.buffer.length > this.options.maxBufferSize) {
      this.buffer = this.buffer.slice(-this.options.maxBufferSize);
    }
  }

  // --- Timing ---

  public time(label: string = 'default'): void {
    if (this.timers.has(label)) {
      this.addLogEntry('warn', [`Timer "${label}" already exists`]);
      return;
    }
    this.timers.set(label, Date.now());
  }

  public timeEnd(label: string = 'default'): void {
    const startTime = this.timers.get(label);
    if (startTime === undefined) {
      this.addLogEntry('warn', [`Timer "${label}" does not exist`]);
      return;
    }
    const duration = Date.now() - startTime;
    this.timers.delete(label);
    this.addLogEntry('log', [`${label}: ${duration}ms`]);
  }

  public timeLog(label: string = 'default', ...args: any[]): void {
    const startTime = this.timers.get(label);
    if (startTime === undefined) {
      this.addLogEntry('warn', [`Timer "${label}" does not exist`]);
      return;
    }
    const elapsed = Date.now() - startTime;
    this.addLogEntry('log', [`${label}: ${elapsed}ms`, ...args]);
  }

  // --- Assertion ---

  public assert(condition?: boolean, ...args: any[]): void {
    if (!condition) {
      if (args.length > 0) {
        this.addLogEntry('error', ['Assertion failed:', ...args]);
      } else {
        this.addLogEntry('error', ['Assertion failed']);
      }
    }
  }

  // --- Counting ---

  public count(label: string = 'default'): void {
    const current = this.counters.get(label) ?? 0;
    const next = current + 1;
    this.counters.set(label, next);
    this.addLogEntry('log', [`${label}: ${next}`]);
  }

  public countReset(label: string = 'default'): void {
    if (!this.counters.has(label)) {
      this.addLogEntry('warn', [`Count for "${label}" does not exist`]);
      return;
    }
    this.counters.delete(label);
  }

  // --- Trace ---

  public trace(...args: any[]): void {
    const stack = new Error().stack || '';
    // Remove the first two lines (Error + this trace() call)
    const cleanStack = stack.split('\n').slice(2).join('\n');
    this.addLogEntry('log', ['Trace:', ...args, '\n' + cleanStack]);
  }

  // --- Clear ---

  public clear(): void {
    this.buffer = [];
    this.groupDepth = 0;
  }

  // --- Buffer access ---

  public getBuffer(): LogEntry[] {
    return [...this.buffer];
  }

  // --- Flush ---

  public async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const output = this.formatBufferForOutput();

    // Print to console with colors
    process.stdout.write('\n' + chalk.cyan('=== Smart Logger Output ===') + '\n');
    process.stdout.write(output + '\n');
    process.stdout.write(chalk.cyan('=== End Smart Logger Output ===') + '\n\n');

    this.clear();
  }

  // --- Formatting ---

  private formatBufferForOutput(): string {
    return this.buffer.map(entry => {
      const timestamp = new Date(entry.timestamp).toISOString().slice(11, 23);
      const sourcePrefix = entry.source === 'browser' ? '[BROWSER] ' : '';
      const levelColor = this.getLevelColor(entry.level);
      const indent = '  '.repeat(entry.groupLevel);

      let content: string;
      if ((entry as any).__isTable) {
        content = this.formatTableData(entry.args[0], entry.args[1]?.__tableColumns);
      } else if ((entry as any).__isDir) {
        content = safeStringify(entry.args[0]);
      } else {
        content = entry.args.map(formatArg).join(' ');
      }

      return `${chalk.gray(timestamp)} ${levelColor(`[${entry.level.toUpperCase()}]`)} ${indent}${sourcePrefix}${content}`;
    }).join('\n');
  }

  private formatBufferForAttachment(): string {
    const header = `Smart Logger Output - ${this.testInfo.title}\n${'='.repeat(50)}\n\n`;
    const content = this.buffer.map(entry => {
      const timestamp = new Date(entry.timestamp).toISOString().slice(11, 23);
      const sourcePrefix = entry.source === 'browser' ? '[BROWSER] ' : '';
      const indent = '  '.repeat(entry.groupLevel);

      let text: string;
      if ((entry as any).__isTable) {
        text = this.formatTableData(entry.args[0], entry.args[1]?.__tableColumns);
      } else if ((entry as any).__isDir) {
        text = safeStringify(entry.args[0]);
      } else {
        text = entry.args.map(formatArg).join(' ');
      }

      return `${timestamp} [${entry.level.toUpperCase()}] ${indent}${sourcePrefix}${text}`;
    }).join('\n');

    return header + content + '\n\n' + '='.repeat(50);
  }

  private formatTableData(data: any, columns?: string[]): string {
    if (data === null || data === undefined) {
      return '(empty table)';
    }

    if (!Array.isArray(data)) {
      // Single object: format as key-value pairs
      if (typeof data === 'object') {
        try {
          const keys = Object.keys(data);
          if (keys.length === 0) return '(empty table)';
          const rows = keys.map(key => `${key} | ${String(data[key])}`);
          return ['Key | Value', '--- | ---', ...rows].join('\n');
        } catch {
          return safeStringify(data);
        }
      }
      return String(data);
    }

    if (data.length === 0) {
      return '(empty table)';
    }

    try {
      const headers = columns || Object.keys(data[0] || {});
      if (headers.length === 0) return safeStringify(data);

      const headerRow = headers.join(' | ');
      const separator = headers.map(() => '---').join(' | ');
      const rows = data.map(item =>
        headers.map(header => String(item?.[header] ?? '')).join(' | ')
      );

      return [headerRow, separator, ...rows].join('\n');
    } catch {
      return safeStringify(data);
    }
  }

  private getLevelColor(level: LogLevel): (text: string) => string {
    switch (level) {
      case 'error': return chalk.red;
      case 'warn': return chalk.yellow;
      case 'info': return chalk.blue;
      case 'debug': return chalk.magenta;
      case 'log': return chalk.white;
      default: return chalk.white;
    }
  }

  // --- Cleanup ---

  public async cleanup(): Promise<void> {
    if (this.pageConsoleListener && this.page) {
      try {
        this.page.off('console', this.pageConsoleListener);
      } catch {
        // Ignore cleanup errors
      }
    }
    this.timers.clear();
    this.counters.clear();
  }

  // --- Flush decision ---

  public shouldFlush(testInfo: TestInfo): boolean {
    const status = testInfo.status;
    const retry = testInfo.retry;

    // Always flush on retries if 'retry' is in flushOn array
    if (retry > 0 && this.options.flushOn.includes('retry')) {
      return true;
    }

    // Map test status to FlushOn values
    const statusMap: { [key: string]: FlushOn } = {
      'passed': 'pass',
      'failed': 'fail',
      'skipped': 'skip',
      'timedOut': 'timeout',
      'expected': 'fixme', // For tests marked with test.fail()
    };

    if (typeof status === 'string' && status in statusMap) {
      const flushType = statusMap[status];
      return this.options.flushOn.includes(flushType);
    }
    return false;
  }
}

const defaultOptions: Required<SmartLogOptions> = {
  flushOn: ['fail', 'retry'],
  maxBufferSize: 1000,
  capturePageConsole: false,
};

export const test = base.extend<{ smartLog: SmartLogFixture }>({
  smartLog: async ({ page }: { page: Page }, use: (fixture: SmartLogFixture) => Promise<void>, testInfo: TestInfo) => {
    // Get options from test.use() or use defaults
    const userOptions = (testInfo.project.use as any).smartLog || {};
    const options: Required<SmartLogOptions> = { ...defaultOptions, ...userOptions };

    const logger = new SmartLogger(testInfo, page, options);

    const fixture: SmartLogFixture = {
      log: (...args) => logger.log(...args),
      debug: (...args) => logger.debug(...args),
      info: (...args) => logger.info(...args),
      warn: (...args) => logger.warn(...args),
      error: (...args) => logger.error(...args),
      group: (...args) => logger.group(...args),
      groupEnd: () => logger.groupEnd(),
      table: (data, columns) => logger.table(data, columns),
      dir: (obj) => logger.dir(obj),
      time: (label) => logger.time(label),
      timeEnd: (label) => logger.timeEnd(label),
      timeLog: (label, ...args) => logger.timeLog(label, ...args),
      assert: (condition, ...args) => logger.assert(condition, ...args),
      count: (label) => logger.count(label),
      countReset: (label) => logger.countReset(label),
      trace: (...args) => logger.trace(...args),
      clear: () => logger.clear(),
      getBuffer: () => logger.getBuffer(),
      flush: () => logger.flush(),
    };

    await use(fixture);

    // After test completion, decide whether to flush
    try {
      if (logger.shouldFlush(testInfo)) {
        await logger.flush();
      }
    } finally {
      await logger.cleanup();
    }
  },
});

export { expect } from '@playwright/test';
