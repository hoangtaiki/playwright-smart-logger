# Playwright Smart Logger - Examples

Comprehensive usage patterns and real-world scenarios for the `smartLog` fixture.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Organized Logging with Groups](#organized-logging-with-groups)
- [Data Display with Tables and Dir](#data-display-with-tables-and-dir)
- [Performance Timing](#performance-timing)
- [Assertions and Counters](#assertions-and-counters)
- [Stack Traces](#stack-traces)
- [FlushOn Configuration](#flushon-configuration)
- [Browser Console Capture](#browser-console-capture)
- [Real-World Scenarios](#real-world-scenarios)
- [Custom Fixture Extensions](#custom-fixture-extensions)
- [Project-Specific Configuration](#project-specific-configuration)

---

## Basic Usage

### Getting Started

Replace your Playwright import and add `smartLog` to your test signature:

```typescript
import { test, expect } from 'playwright-smart-logger';

test('my first smart log test', async ({ page, smartLog }) => {
  smartLog.info('Starting navigation');
  await page.goto('https://example.com');

  smartLog.log('Page loaded:', page.url());
  smartLog.warn('This only shows if the test fails');

  expect(await page.title()).toBeTruthy();
});
```

### Multiple Log Levels

```typescript
test('log levels', async ({ smartLog }) => {
  smartLog.log('General message');       // White
  smartLog.debug('Debugging details');   // Magenta
  smartLog.info('Informational');        // Blue
  smartLog.warn('Potential issue');       // Yellow
  smartLog.error('Something went wrong');// Red
});
```

### Variadic Arguments

All logging methods accept multiple arguments, joined with spaces:

```typescript
test('variadic args', async ({ page, smartLog }) => {
  const user = { name: 'Alice', role: 'admin' };
  smartLog.log('User:', user, 'logged in at', new Date().toISOString());

  const status = 200;
  smartLog.info('Response status:', status, '- OK');

  smartLog.error('Failed to load', page.url(), 'after', 3, 'retries');
});
```

---

## Organized Logging with Groups

Groups add visual indentation to structure your logs by test phase:

```typescript
test('user registration flow', async ({ page, smartLog }) => {
  smartLog.group('Setup');
  smartLog.log('Generating test data');
  const email = `test-${Date.now()}@example.com`;
  smartLog.log('Email:', email);
  smartLog.groupEnd();

  smartLog.group('Navigation');
  await page.goto('https://app.com/register');
  smartLog.log('Registration page loaded');
  smartLog.groupEnd();

  smartLog.group('Form Interaction');
  await page.fill('#email', email);
  smartLog.log('Email filled');
  await page.fill('#password', 'SecurePass123!');
  smartLog.log('Password filled');
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
10:30:01.200 [LOG] Navigation
10:30:01.500 [LOG]   Registration page loaded
10:30:01.501 [LOG] Form Interaction
10:30:01.600 [LOG]   Email filled
10:30:01.700 [LOG]   Password filled
10:30:01.800 [LOG]   Form submitted
10:30:01.801 [LOG] Validation
10:30:02.100 [LOG]   Registration successful
=== End Smart Logger Output ===
```

### Nested Groups

```typescript
test('nested groups', async ({ page, smartLog }) => {
  smartLog.group('API Testing');

  smartLog.group('Authentication');
  smartLog.log('Testing login endpoint');
  smartLog.log('Token received');
  smartLog.groupEnd();

  smartLog.group('CRUD Operations');
  smartLog.log('Creating resource');
  smartLog.log('Reading resource');
  smartLog.log('Updating resource');
  smartLog.log('Deleting resource');
  smartLog.groupEnd();

  smartLog.groupEnd();
});
```

---

## Data Display with Tables and Dir

### Table - Array of Objects

```typescript
test('API response validation', async ({ page, smartLog }) => {
  const endpoints = [
    { path: '/api/users', method: 'GET', expected: 200 },
    { path: '/api/posts', method: 'GET', expected: 200 },
    { path: '/api/auth',  method: 'POST', expected: 201 },
  ];

  smartLog.table(endpoints);
});
```

**Output:**
```
path | method | expected
--- | --- | ---
/api/users | GET | 200
/api/posts | GET | 200
/api/auth | POST | 201
```

### Table with Specific Columns

```typescript
smartLog.table(endpoints, ['path', 'method']);
// Only shows path and method columns
```

### Dir - Object Inspection

```typescript
test('inspecting objects', async ({ page, smartLog }) => {
  await page.goto('https://example.com');

  const pageInfo = {
    url: page.url(),
    title: await page.title(),
    viewport: page.viewportSize(),
    cookies: await page.context().cookies(),
  };

  smartLog.dir(pageInfo);
});
```

---

## Performance Timing

### Basic Timing

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

### Checkpoints with timeLog

```typescript
test('workflow timing', async ({ page, smartLog }) => {
  smartLog.time('workflow');

  await page.goto('https://app.com');
  smartLog.timeLog('workflow', 'page loaded');

  await page.click('#start');
  smartLog.timeLog('workflow', 'action triggered');

  await page.waitForSelector('.result');
  smartLog.timeEnd('workflow');
});
```

---

## Assertions and Counters

### Inline Assertions

`smartLog.assert()` logs only when the condition is false:

```typescript
test('validation with assertions', async ({ page, smartLog }) => {
  await page.goto('https://app.com');

  const title = await page.title();
  smartLog.assert(title.length > 0, 'Page must have a title');
  smartLog.assert(page.url().includes('app.com'), 'URL mismatch');

  const status = 200;
  smartLog.assert(status < 400, 'Expected success status, got', status);
  // Nothing logged ^ because all conditions are true
});
```

### Counters for Tracking

```typescript
test('counting operations', async ({ page, smartLog }) => {
  await page.goto('https://app.com');

  const links = await page.locator('a').all();
  for (const link of links) {
    const href = await link.getAttribute('href');
    if (href?.startsWith('http')) {
      smartLog.count('external-links');
    } else {
      smartLog.count('internal-links');
    }
  }
  // Logs: "external-links: 1", "internal-links: 1", "external-links: 2", etc.

  smartLog.countReset('external-links');
  smartLog.countReset('internal-links');
});
```

---

## Stack Traces

```typescript
test('debugging with traces', async ({ smartLog }) => {
  smartLog.trace('reached initialization');
  // Logs "Trace: reached initialization" followed by the call stack

  function processData() {
    smartLog.trace('processing data');
  }

  processData();
});
```

---

## FlushOn Configuration

### Common Patterns

```typescript
// playwright.config.ts

// CI - minimal noise
use: {
  smartLog: { flushOn: ['fail'] }
}

// Development (default)
use: {
  smartLog: { flushOn: ['fail', 'retry'] }
}

// Debug - see everything
use: {
  smartLog: { flushOn: ['fail', 'pass', 'skip', 'fixme', 'retry', 'timeout'] }
}

// Issue investigation - focus on problems
use: {
  smartLog: { flushOn: ['fail', 'retry', 'timeout'] }
}
```

### Environment-Based Configuration

```typescript
// playwright.config.ts
const smartLogConfig: SmartLogOptions = process.env.CI
  ? {
      flushOn: ['fail'],
      maxBufferSize: 500,
      capturePageConsole: false,
    }
  : {
      flushOn: ['fail', 'retry'],
      maxBufferSize: 1000,
      capturePageConsole: true,
    };

export default defineConfig({
  use: {
    smartLog: smartLogConfig,
  },
});
```

---

## Browser Console Capture

When `capturePageConsole: true`, browser-side `console.*` calls are captured alongside test logs:

```typescript
// playwright.config.ts
use: {
  smartLog: {
    flushOn: ['fail', 'retry'],
    capturePageConsole: true,
  }
}
```

```typescript
test('browser console capture', async ({ page, smartLog }) => {
  smartLog.info('Navigating to app');
  await page.goto('https://app.com');

  // Any console.log/warn/error in the browser will appear in the buffer
  // with source: 'browser'

  await page.evaluate(() => {
    console.log('App initialized');
    console.warn('Deprecation notice');
  });

  const browserLogs = smartLog.getBuffer().filter(e => e.source === 'browser');
  smartLog.info('Captured', browserLogs.length, 'browser logs');
});
```

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
  const items = await listRes.json();
  smartLog.table(items);
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
  smartLog.log('Card number entered');

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
    smartLog.dir({
      url: page.url(),
      title: await page.title(),
    });
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

## Custom Fixture Extensions

You can extend the smart logger fixture to add domain-specific logging:

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

---

## Project-Specific Configuration

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
        smartLog: {
          flushOn: ['fail'],
          maxBufferSize: 500,
        },
      },
    },
  ],
});
```
