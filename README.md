# Playwright Smart Logger

<div align="center">

[![npm version](https://badge.fury.io/js/playwright-smart-logger.svg)](https://badge.fury.io/js/playwright-smart-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/hoangtaiki/playwright-smart-logger/actions/workflows/ci.yml/badge.svg)](https://github.com/hoangtaiki/playwright-smart-logger/actions/workflows/ci.yml)
[![Downloads](https://img.shields.io/npm/dt/playwright-smart-logger.svg)](https://www.npmjs.com/package/playwright-smart-logger)

**Smart logging fixture for Playwright that buffers output and flushes only when needed**

</div>

Smart Logger provides a `smartLog` fixture with the full console API. Logs are buffered during test execution and only displayed when tests fail, retry, or meet conditions you configure via `flushOn`. Passing tests produce zero log noise.

## The Problem

```
PASS  Test 1  [15 lines of console.log spam]
PASS  Test 2  [23 lines of console.log spam]
PASS  Test 3  [18 lines of console.log spam]
FAIL  Test 4  [31 lines buried in noise]
```

## The Solution

```
PASS  Test 1
PASS  Test 2
PASS  Test 3
FAIL  Test 4  [Clean, formatted logs attached to report]
```

## Installation

```bash
npm install playwright-smart-logger
```

## Quick Start

**1. Import from smart logger instead of `@playwright/test`**

```typescript
import { test, expect } from 'playwright-smart-logger';
```

**2. Use the `smartLog` fixture in your tests**

```typescript
test('user login', async ({ page, smartLog }) => {
  smartLog.info('Navigating to login page');
  await page.goto('https://app.com/login');

  smartLog.log('Filling credentials');
  await page.fill('#email', 'user@test.com');
  await page.fill('#password', 'password');

  smartLog.time('login');
  await page.click('#submit');
  smartLog.timeEnd('login');

  // PASS: no output
  // FAIL: all logs displayed with colors + attached to report
  await expect(page.locator('.dashboard')).toBeVisible();
});
```

**3. (Optional) Configure in `playwright.config.ts`**

```typescript
import { defineConfig } from '@playwright/test';
import type { SmartLogOptions } from 'playwright-smart-logger';

export default defineConfig({
  use: {
    smartLog: {
      flushOn: ['fail', 'retry'],
      maxBufferSize: 1000,
      capturePageConsole: false,
    } as SmartLogOptions,
  },
});
```

## API Reference

The `smartLog` fixture provides the same methods as `console`:

### Logging

```typescript
smartLog.log(...args)     // General purpose
smartLog.debug(...args)   // Debug level
smartLog.info(...args)    // Info level
smartLog.warn(...args)    // Warning level
smartLog.error(...args)   // Error level
```

All methods accept variadic arguments, just like `console`:

```typescript
smartLog.log('User:', userName, 'logged in at', new Date());
smartLog.error('Request failed', { status: 500, url: '/api' });
```

### Grouping

```typescript
smartLog.group('Setup Phase');
smartLog.log('Creating test data');
smartLog.log('Initializing database');
smartLog.groupEnd();

smartLog.group('Test Phase');
smartLog.log('Running assertions');
smartLog.groupEnd();
```

Groups add indentation to log output for visual structure.

### Data Display

```typescript
// Table - structured data
smartLog.table([
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' },
]);

// Table with specific columns
smartLog.table(data, ['name', 'role']);

// Dir - object inspection
smartLog.dir({ nested: { deeply: { value: 42 } } });
```

### Timing

```typescript
smartLog.time('page-load');
await page.goto('https://app.com');
smartLog.timeLog('page-load', 'navigation done');  // Log without stopping
await page.waitForLoadState('networkidle');
smartLog.timeEnd('page-load');  // Logs: "page-load: 1234ms"
```

### Assertions

```typescript
smartLog.assert(response.ok(), 'API should return 200');
// Logs "Assertion failed: API should return 200" only if condition is false
// Does nothing if condition is true
```

### Counters

```typescript
for (const item of items) {
  smartLog.count('processed');  // "processed: 1", "processed: 2", ...
}
smartLog.countReset('processed');
```

### Stack Trace

```typescript
smartLog.trace('reached checkpoint');
// Logs "Trace: reached checkpoint" with stack trace
```

### Buffer Control

```typescript
smartLog.clear();                // Clear buffer and reset group depth
const entries = smartLog.getBuffer();  // Get current buffer contents
await smartLog.flush();          // Manually flush to console + report
```

## Configuration

```typescript
interface SmartLogOptions {
  flushOn?: FlushOn[];           // When to display logs (default: ['fail', 'retry'])
  maxBufferSize?: number;        // Max buffer entries (default: 1000)
  capturePageConsole?: boolean;  // Capture browser console (default: false)
}

type FlushOn = 'fail' | 'pass' | 'skip' | 'fixme' | 'retry' | 'timeout';
```

### `flushOn`

Controls when buffered logs are automatically flushed after a test completes:

| Value | Triggers when |
|-------|--------------|
| `'fail'` | Test fails |
| `'pass'` | Test passes |
| `'skip'` | Test is skipped (`test.skip()`) |
| `'fixme'` | Test is marked as expected failure (`test.fail()`) |
| `'retry'` | Test is being retried |
| `'timeout'` | Test times out |

### Common Configurations

```typescript
// CI - only failures
flushOn: ['fail']

// Development - failures and retries (default)
flushOn: ['fail', 'retry']

// Debug - everything
flushOn: ['fail', 'pass', 'skip', 'fixme', 'retry', 'timeout']
```

### `maxBufferSize`

Maximum number of log entries kept in the buffer. When exceeded, oldest entries are removed. Default: `1000`.

### `capturePageConsole`

When `true`, browser `console.*` calls are captured and added to the buffer with `source: 'browser'`. Default: `false`.

## Log Entry Structure

Each buffered log entry has this shape:

```typescript
interface LogEntry {
  level: 'log' | 'debug' | 'info' | 'warn' | 'error';
  args: any[];
  timestamp: number;
  source: 'test' | 'browser';
  groupLevel: number;
}
```

Use `smartLog.getBuffer()` to inspect entries programmatically.

## Documentation

- **[Examples](Example.md)** - Comprehensive usage patterns and real-world scenarios
- **[Migration Guide](MIGRATION.md)** - Adopting Smart Logger in your project
- **[Contributing](CONTRIBUTING.md)** - Development guidelines

## License

MIT © [Harry Tran](https://github.com/hoangtaiki)

---

<div align="center">

**[GitHub](https://github.com/hoangtaiki/playwright-smart-logger) · [NPM](https://www.npmjs.com/package/playwright-smart-logger)**

</div>
