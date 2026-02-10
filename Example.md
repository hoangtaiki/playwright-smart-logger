# Playwright Smart Logger - Examples & API Details

Comprehensive usage patterns, API reference, configuration, and real-world scenarios.

## Table of Contents

- [API Reference](#api-reference)
  - [Logging](#logging)
  - [Grouping](#grouping)
  - [Data Display](#data-display)
  - [Timing](#timing)
  - [Assertions](#assertions)
  - [Counters](#counters)
  - [Stack Traces](#stack-traces)
  - [Buffer Control](#buffer-control)
- [Global Access / Page Object Models](#global-access--page-object-models)
- [Configuration](#configuration)
  - [flushOn](#flushon)
  - [maxBufferSize](#maxbuffersize)
  - [capturePageConsole](#capturepageconsole)
  - [Environment-Based Configuration](#environment-based-configuration)
  - [Project-Specific Configuration](#project-specific-configuration)
- [Log Entry Structure](#log-entry-structure)
- [Real-World Scenarios](#real-world-scenarios)
- [Logging Inside Custom Fixtures](#logging-inside-custom-fixtures)
- [Custom Fixture Extensions](#custom-fixture-extensions)

---

## API Reference

The `smartLog` fixture provides the same methods as `console`. All methods accept variadic arguments.

### Logging

```typescript
test('log levels', async ({ smartLog }) => {
  smartLog.log('General message');        // White
  smartLog.debug('Debugging details');    // Magenta
  smartLog.info('Informational');         // Blue
  smartLog.warn('Potential issue');       // Yellow
  smartLog.error('Something went wrong'); // Red

  // Multiple arguments, just like console
  smartLog.log('User:', { name: 'Alice' }, 'logged in at', new Date());
  smartLog.error('Request failed', { status: 500, url: '/api' });
});
```

### Grouping

Groups add indentation to structure logs by test phase:

```typescript
test('user registration flow', async ({ page, smartLog }) => {
  smartLog.group('Setup');
  smartLog.log('Generating test data');
  const email = `test-${Date.now()}@example.com`;
  smartLog.log('Email:', email);
  smartLog.groupEnd();

  smartLog.group('Form Interaction');
  await page.fill('#email', email);
  smartLog.log('Email filled');
  await page.click('#register-btn');
  smartLog.log('Form submitted');
  smartLog.groupEnd();

  smartLog.group('Validation');
  await expect(page.locator('.success')).toBeVisible();
  smartLog.log('Registration successful');
  smartLog.groupEnd();
});
```

**Output on failure:**
```
=== Smart Logger Output ===
10:30:01.123 [LOG] Setup
10:30:01.124 [LOG]   Generating test data
10:30:01.124 [LOG]   Email: test-1234567890@example.com
10:30:01.501 [LOG] Form Interaction
10:30:01.600 [LOG]   Email filled
10:30:01.800 [LOG]   Form submitted
10:30:01.801 [LOG] Validation
10:30:02.100 [LOG]   Registration successful
=== End Smart Logger Output ===
```

Groups can be nested:

```typescript
smartLog.group('API Testing');
  smartLog.group('Authentication');
  smartLog.log('Token received');
  smartLog.groupEnd();

  smartLog.group('CRUD Operations');
  smartLog.log('Creating resource');
  smartLog.groupEnd();
smartLog.groupEnd();
```

### Data Display

```typescript
// Table - array of objects
const endpoints = [
  { path: '/api/users', method: 'GET', expected: 200 },
  { path: '/api/posts', method: 'GET', expected: 200 },
  { path: '/api/auth',  method: 'POST', expected: 201 },
];
smartLog.table(endpoints);

// Table with specific columns
smartLog.table(endpoints, ['path', 'method']);

// Dir - object inspection (handles circular references)
smartLog.dir({ nested: { deeply: { value: 42 } } });
```

**Table output:**
```
path | method | expected
--- | --- | ---
/api/users | GET | 200
/api/posts | GET | 200
/api/auth | POST | 201
```

### Timing

```typescript
test('page load performance', async ({ page, smartLog }) => {
  smartLog.time('total');

  smartLog.time('navigation');
  await page.goto('https://app.com');
  smartLog.timeEnd('navigation');  // "navigation: 842ms"

  smartLog.time('interactive');
  await page.waitForLoadState('networkidle');
  smartLog.timeEnd('interactive');  // "interactive: 356ms"

  smartLog.timeEnd('total');  // "total: 1198ms"
});
```

Use `timeLog` for checkpoints without stopping the timer:

```typescript
smartLog.time('workflow');
await page.goto('https://app.com');
smartLog.timeLog('workflow', 'page loaded');     // elapsed so far
await page.click('#start');
smartLog.timeLog('workflow', 'action triggered');
await page.waitForSelector('.result');
smartLog.timeEnd('workflow');                     // final elapsed
```

### Assertions

`smartLog.assert()` logs only when the condition is false — nothing logged when true:

```typescript
smartLog.assert(response.ok(), 'API should return 200');
smartLog.assert(title.length > 0, 'Page must have a title');
smartLog.assert(status < 400, 'Expected success status, got', status);
```

### Counters

```typescript
const links = await page.locator('a').all();
for (const link of links) {
  const href = await link.getAttribute('href');
  if (href?.startsWith('http')) {
    smartLog.count('external-links');  // "external-links: 1", "external-links: 2", ...
  } else {
    smartLog.count('internal-links');
  }
}
smartLog.countReset('external-links');
smartLog.countReset('internal-links');
```

### Stack Traces

```typescript
smartLog.trace('reached checkpoint');
// Logs "Trace: reached checkpoint" followed by the call stack
```

### Buffer Control

```typescript
smartLog.clear();                       // Clear buffer and reset group depth
const entries = smartLog.getBuffer();   // Get current buffer contents (copy)
await smartLog.flush();                 // Manually flush to console
```

---

## Global Access / Page Object Models

The `smartLog` export is a proxy that delegates to the current test's logger. Import it anywhere — no need to pass the fixture through parameters.

### Page Object Model

```typescript
// pages/login.page.ts
import { smartLog } from 'playwright-smart-logger';
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async login(username: string, password: string) {
    smartLog.group('LoginPage.login');
    smartLog.info('Logging in as', username);

    await this.page.fill('#username', username);
    await this.page.fill('#password', password);

    smartLog.time('login-submit');
    await this.page.click('#submit');
    await this.page.waitForURL('**/dashboard');
    smartLog.timeEnd('login-submit');

    smartLog.info('Login successful');
    smartLog.groupEnd();
  }
}
```

```typescript
// pages/dashboard.page.ts
import { smartLog } from 'playwright-smart-logger';
import { Page } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async getStats() {
    smartLog.debug('Fetching dashboard stats');
    const stats = await this.page.locator('.stats').textContent();
    smartLog.debug('Stats:', stats);
    return stats;
  }
}
```

```typescript
// tests/login.spec.ts
import { test, expect } from 'playwright-smart-logger';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';

test('user can login and view dashboard', async ({ page, smartLog }) => {
  //                                                     ^^^^^^^^ activates the logger
  const loginPage = new LoginPage(page);
  await loginPage.login('alice', 'password123');

  const dashboard = new DashboardPage(page);
  const stats = await dashboard.getStats();
  expect(stats).toBeTruthy();
});
```

### Helper Functions

```typescript
// helpers/api.ts
import { smartLog } from 'playwright-smart-logger';
import { Page } from '@playwright/test';

export async function waitForApi(page: Page, url: string) {
  smartLog.debug('Waiting for API:', url);
  const response = await page.waitForResponse(url);
  smartLog.debug('API responded:', response.status());
  return response;
}

export async function retryClick(page: Page, selector: string, maxRetries = 3) {
  for (let i = 1; i <= maxRetries; i++) {
    smartLog.count('click-attempts');
    try {
      await page.click(selector, { timeout: 2000 });
      smartLog.info('Click succeeded on attempt', i);
      return;
    } catch {
      smartLog.warn(`Click attempt ${i}/${maxRetries} failed`);
    }
  }
  smartLog.error('All click attempts failed for', selector);
  throw new Error(`Failed to click ${selector} after ${maxRetries} attempts`);
}
```

```typescript
// tests/checkout.spec.ts
import { test, expect } from 'playwright-smart-logger';
import { waitForApi, retryClick } from '../helpers/api';

test('checkout flow', async ({ page, smartLog }) => {
  await page.goto('https://shop.com/cart');

  await retryClick(page, '#checkout-btn');
  const response = await waitForApi(page, '**/api/checkout');
  expect(response.ok()).toBeTruthy();
});
```

### Using `getSmartLog()` Instead

If you prefer an explicit function call over the proxy import:

```typescript
import { getSmartLog } from 'playwright-smart-logger';

export function logStep(message: string) {
  const log = getSmartLog();
  log.info(`[STEP] ${message}`);
}
```

Both `smartLog` (proxy) and `getSmartLog()` (function) write to the same buffer as the fixture.

---

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

Controls when buffered logs are flushed after a test completes:

| Value | Triggers when |
|-------|--------------|
| `'fail'` | Test fails |
| `'pass'` | Test passes |
| `'skip'` | Test is skipped (`test.skip()`) |
| `'fixme'` | Test is marked as expected failure (`test.fail()`) |
| `'retry'` | Test is being retried |
| `'timeout'` | Test times out |

Common patterns:

```typescript
// CI - only failures
flushOn: ['fail']

// Development - failures and retries (default)
flushOn: ['fail', 'retry']

// Debug - everything
flushOn: ['fail', 'pass', 'skip', 'fixme', 'retry', 'timeout']
```

### `maxBufferSize`

Maximum log entries kept in the buffer. When exceeded, oldest entries are removed. Default: `1000`.

### `capturePageConsole`

When `true`, browser `console.*` calls are captured and added to the buffer with `source: 'browser'`. Default: `false`.

```typescript
// playwright.config.ts
use: {
  smartLog: {
    capturePageConsole: true,
  }
}
```

```typescript
test('browser console capture', async ({ page, smartLog }) => {
  await page.goto('https://app.com');

  // Browser console.log/warn/error will appear in the buffer
  await page.evaluate(() => {
    console.log('App initialized');
    console.warn('Deprecation notice');
  });

  const browserLogs = smartLog.getBuffer().filter(e => e.source === 'browser');
  smartLog.info('Captured', browserLogs.length, 'browser logs');
});
```

### Environment-Based Configuration

```typescript
// playwright.config.ts
import type { SmartLogOptions } from 'playwright-smart-logger';

const smartLogConfig: SmartLogOptions = process.env.CI
  ? { flushOn: ['fail'], maxBufferSize: 500 }
  : { flushOn: ['fail', 'retry'], maxBufferSize: 1000, capturePageConsole: true };

export default defineConfig({
  use: {
    smartLog: smartLogConfig,
  },
});
```

### Project-Specific Configuration

Different projects can have different logging behavior:

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'default',
      use: {
        smartLog: { flushOn: ['fail', 'retry'] },
      },
    },
    {
      name: 'debug',
      use: {
        smartLog: {
          flushOn: ['fail', 'pass', 'skip', 'fixme', 'retry', 'timeout'],
          maxBufferSize: 2000,
          capturePageConsole: true,
        },
      },
      testMatch: /.*debug.*\.spec\.ts/,
    },
    {
      name: 'ci',
      use: {
        smartLog: { flushOn: ['fail'], maxBufferSize: 500 },
      },
    },
  ],
});
```

---

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

---

## Real-World Scenarios

### API Testing

```typescript
test('comprehensive API test', async ({ request, smartLog }) => {
  smartLog.group('Authentication');
  smartLog.time('auth');
  const authResponse = await request.post('/api/login', {
    data: { email: 'test@example.com', password: 'password' },
  });
  smartLog.timeEnd('auth');
  smartLog.assert(authResponse.ok(), 'Login should succeed');
  const { token } = await authResponse.json();
  smartLog.groupEnd();

  smartLog.group('CRUD Operations');
  const headers = { Authorization: `Bearer ${token}` };

  smartLog.time('create');
  const createRes = await request.post('/api/items', {
    headers,
    data: { name: 'Test Item' },
  });
  smartLog.timeEnd('create');
  smartLog.log('Created item:', await createRes.json());

  smartLog.time('list');
  const listRes = await request.get('/api/items', { headers });
  smartLog.timeEnd('list');
  smartLog.table(await listRes.json());
  smartLog.groupEnd();
});
```

### Form Workflow with Error Context

```typescript
test('checkout flow', async ({ page, smartLog }) => {
  smartLog.group('Cart Setup');
  await page.goto('https://shop.com/cart');
  smartLog.log('Cart page loaded');
  smartLog.groupEnd();

  smartLog.group('Checkout');
  smartLog.time('checkout-flow');

  await page.fill('#card-number', '4242424242424242');
  await page.fill('#expiry', '12/25');
  await page.fill('#cvv', '123');
  smartLog.log('Card details completed');

  await page.click('#pay');
  smartLog.timeLog('checkout-flow', 'payment submitted');

  try {
    await expect(page.locator('.confirmation')).toBeVisible({ timeout: 10000 });
    smartLog.log('Payment confirmed');
  } catch (error) {
    smartLog.error('Payment failed');
    smartLog.dir({ url: page.url(), title: await page.title() });
    throw error;
  }

  smartLog.timeEnd('checkout-flow');
  smartLog.groupEnd();
});
```

### Performance Monitoring

```typescript
test('performance metrics', async ({ page, smartLog }) => {
  smartLog.time('total');
  await page.goto('https://app.com');

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
      loadComplete: Math.round(nav.loadEventEnd - nav.startTime),
      firstPaint: Math.round(
        performance.getEntriesByName('first-paint')[0]?.startTime || 0
      ),
    };
  });

  smartLog.table([metrics]);
  smartLog.assert(metrics.domContentLoaded < 3000, 'DOM load too slow:', metrics.domContentLoaded, 'ms');
  smartLog.assert(metrics.firstPaint < 1500, 'First paint too slow:', metrics.firstPaint, 'ms');
  smartLog.timeEnd('total');
});
```

---

## Logging Inside Custom Fixtures

You can use `smartLog` inside custom fixtures, but there is an important rule: **your fixture must declare `smartLog` as a dependency**. Without it, Playwright may run your fixture before the logger is initialized, and the global `smartLog` proxy will throw an error.

### The Problem

```typescript
import { test as base, smartLog } from 'playwright-smart-logger';

const test = base.extend({
  // BAD — smartLog is NOT listed as a dependency
  myFixture: [async ({ page }, use) => {
    smartLog.info('Setting up');  // Throws! Logger may not be initialized yet
    await use();
  }, { auto: true }],
});
```

Playwright runs fixtures in dependency order. Since `myFixture` only depends on `page`, there is no guarantee the `smartLog` fixture has been set up first. When it hasn't, the global proxy calls `assertFixtureActive()` and throws:

> *"smartLog was accessed outside of a test that uses the smartLog fixture."*

### The Fix

Add `smartLog` to your fixture's dependencies:

```typescript
import { test as base, smartLog } from 'playwright-smart-logger';

const test = base.extend({
  // GOOD — smartLog is declared as a dependency
  myFixture: [async ({ page, smartLog: _smartLog }, use) => {
    //                       ^^^^^^^^^^^^^^^^ tells Playwright to initialize the logger first

    // Both the global proxy and the fixture variable work
    smartLog.info('Setting up via global proxy');
    _smartLog.info('Setting up via fixture');

    await use();
  }, { auto: true }],
});
```

### Full Example: Auto-Login Fixture

```typescript
import { test as base, smartLog } from 'playwright-smart-logger';

interface Env {
  apiHelper?: APIHelper;
}

const env: Env = {};

const test = base.extend({
  autoSetup: [async ({ page, smartLog: _smartLog }, use, testInfo) => {
    smartLog.group('Auto Setup');

    if (!env.apiHelper) {
      const helper = new APIHelper();
      await helper.signIn();
      env.apiHelper = helper;
      smartLog.info('API helper initialized and signed in');
    } else {
      smartLog.debug('Reusing existing API helper');
    }

    smartLog.groupEnd();
    await use();
  }, { auto: true }],
});

export { test };
```

### Using the Fixture Variable Directly

If you prefer, you can skip the global proxy entirely and use the fixture variable:

```typescript
const test = base.extend({
  seedData: async ({ smartLog }, use) => {
    smartLog.group('Seed Data');
    smartLog.info('Creating test users');
    // ... seed logic
    smartLog.groupEnd();

    await use();

    smartLog.group('Cleanup');
    smartLog.info('Removing test data');
    // ... cleanup logic
    smartLog.groupEnd();
  },
});
```

Both approaches write to the same buffer and follow the same flush rules.

---

## Custom Fixture Extensions

Extend the smart logger fixture to add domain-specific logging:

```typescript
// fixtures/app-logger.ts
import { test as base } from 'playwright-smart-logger';

interface AppLogFixture {
  logApiCall: (method: string, url: string, status: number, duration: number) => void;
  logUserAction: (action: string, element?: string) => void;
}

export const test = base.extend<{ appLog: AppLogFixture }>({
  appLog: async ({ smartLog }, use) => {
    const fixture: AppLogFixture = {
      logApiCall: (method, url, status, duration) => {
        const icon = status >= 400 ? 'FAIL' : 'OK';
        smartLog.log(`[${icon}] ${method} ${url} -> ${status} (${duration}ms)`);
      },
      logUserAction: (action, element) => {
        const target = element ? ` on ${element}` : '';
        smartLog.info(`User: ${action}${target}`);
      },
    };
    await use(fixture);
  },
});
```

```typescript
// tests/app.spec.ts
import { test } from '../fixtures/app-logger';

test('app test', async ({ page, smartLog, appLog }) => {
  appLog.logUserAction('Navigate', 'login page');
  await page.goto('https://app.com/login');

  appLog.logUserAction('Click', '#submit');
  await page.click('#submit');

  appLog.logApiCall('POST', '/api/login', 200, 150);
});
```
