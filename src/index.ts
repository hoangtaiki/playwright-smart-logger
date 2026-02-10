// Export the main test fixture and types
export { test, expect } from './smart-log-fixture';
export type { 
  SmartLogOptions, 
  SmartLogFixture, 
  LogLevel, 
  LogEntry, 
  FlushOn 
} from './smart-log-fixture';

// Re-export commonly used Playwright types for convenience
export type { TestInfo, Page, Browser, BrowserContext } from '@playwright/test';