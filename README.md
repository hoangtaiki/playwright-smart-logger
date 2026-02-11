# Playwright Smart Logger

<div align="center">

[![npm version](https://badge.fury.io/js/playwright-smart-logger.svg)](https://badge.fury.io/js/playwright-smart-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/hoangtaiki/playwright-smart-logger/actions/workflows/ci.yml/badge.svg)](https://github.com/hoangtaiki/playwright-smart-logger/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/hoangtaiki/playwright-smart-logger/branch/main/graph/badge.svg)](https://codecov.io/gh/hoangtaiki/playwright-smart-logger)
[![Downloads](https://img.shields.io/npm/dt/playwright-smart-logger.svg)](https://www.npmjs.com/package/playwright-smart-logger)

**Smart logging for Playwright — buffers output, flushes only when needed**

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
FAIL  Test 4  [Clean, formatted logs with timestamps and colors]
```

## Quick Start

### 1. Install

```bash
npm install playwright-smart-logger
```

### 2. Replace your import and add `smartLog` to your test

```typescript
import { test, expect } from 'playwright-smart-logger';

test('user login', async ({ page, smartLog }) => {
  smartLog.info('Navigating to login page');
  await page.goto('https://app.com/login');

  smartLog.log('Filling credentials');
  await page.fill('#email', 'user@test.com');
  await page.fill('#password', 'password');
  await page.click('#submit');

  // PASS: zero output
  // FAIL: all logs displayed with colors + timestamps
  await expect(page.locator('.dashboard')).toBeVisible();
});
```

### 3. (Optional) Configure in `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test';
import type { SmartLogOptions } from 'playwright-smart-logger';

export default defineConfig({
  use: {
    smartLog: {
      flushOn: ['fail', 'retry'], // when to show logs (default)
      maxBufferSize: 1000, // max buffered entries (default)
      capturePageConsole: false, // capture browser console (default)
    } as SmartLogOptions,
  },
});
```

## Use Anywhere — Page Objects, Helpers, Utilities

Import `smartLog` and use it directly. No need to pass the fixture through parameters:

```typescript
import { smartLog } from 'playwright-smart-logger';

class LoginPage {
  constructor(private page: Page) {}

  async login(username: string, password: string) {
    smartLog.info('Logging in as', username);
    await this.page.fill('#username', username);
    await this.page.fill('#password', password);
    await this.page.click('#submit');
  }
}
```

It's a proxy that delegates to the current test's logger. Each test still gets full isolation.

> **Note:** Your test must destructure `smartLog` to activate the logger:
>
> ```typescript
> test('login', async ({ page, smartLog }) => {
>   //                          ^^^^^^^^ required
>   const loginPage = new LoginPage(page);
>   await loginPage.login('user', 'pass');
> });
> ```

A `getSmartLog()` function is also available if you prefer explicit function calls.

## API

The `smartLog` fixture mirrors the `console` API:

| Method                                  | Description             |
| --------------------------------------- | ----------------------- |
| `log`, `debug`, `info`, `warn`, `error` | Log at different levels |
| `group` / `groupEnd`                    | Indented log groups     |
| `table(data, columns?)`                 | Structured data display |
| `dir(obj)`                              | Object inspection       |
| `time` / `timeLog` / `timeEnd`          | Performance timing      |
| `assert(condition, ...args)`            | Log only on failure     |
| `count` / `countReset`                  | Counters                |
| `trace`                                 | Stack trace             |
| `clear` / `getBuffer` / `flush`         | Buffer control          |

## Logging Inside Custom Fixtures

When extending the base test with custom fixtures, you **must** declare `smartLog` as a dependency so Playwright initializes the logger before your fixture runs:

```typescript
import { test as base, smartLog } from 'playwright-smart-logger';

const test = base.extend({
  autoTest: [
    async ({ page, smartLog: _smartLog }, use, testInfo) => {
      //                       ^^^^^^^^^^^^^^^^ required — ensures the logger is initialized

      // Global proxy works because smartLog fixture is active
      smartLog.info('Setting up auto fixture');

      // Or use the fixture directly
      _smartLog.info('Also works');

      await use();
    },
    { auto: true },
  ],
});
```

Without `smartLog` in the destructured dependencies, the global `smartLog` proxy will throw because the logger may not be initialized yet. See [Examples](Example.md#logging-inside-custom-fixtures) for more details.

## Documentation

- **[Examples & API Details](Example.md)** — Usage patterns, configuration, real-world scenarios
- **[Migration Guide](MIGRATION.md)** — Adopting Smart Logger in existing projects
- **[Contributing](CONTRIBUTING.md)** — Development guidelines

## License

MIT © [Harry Tran](https://github.com/hoangtaiki)

---

<div align="center">

**[GitHub](https://github.com/hoangtaiki/playwright-smart-logger) · [NPM](https://www.npmjs.com/package/playwright-smart-logger)**

</div>
