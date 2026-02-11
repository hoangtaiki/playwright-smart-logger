// Export the main test fixture and types
export { test, expect, getSmartLog, smartLog } from './smart-log';
export type {
  SmartLogOptions,
  SmartLog,
  LogLevel,
  LogEntry,
  FlushOn,
} from './smart-log';

// Re-export commonly used Playwright types for convenience
export type { TestInfo, Page, Browser, BrowserContext } from '@playwright/test';
