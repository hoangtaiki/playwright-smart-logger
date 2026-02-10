# Migration Guide

## From Standard Playwright to Smart Logger

### Step 1: Install

```bash
npm install playwright-smart-logger
```

### Step 2: Update Imports

```typescript
// Before
import { test, expect } from '@playwright/test';

// After
import { test, expect } from 'playwright-smart-logger';
```

### Step 3: Add `smartLog` to Test Signatures

Add `smartLog` to the destructured fixture parameter in any test that needs logging:

```typescript
// Before
test('my test', async ({ page }) => {
  console.log('Navigating...');
  await page.goto('https://example.com');
  console.log('Done');
});

// After
test('my test', async ({ page, smartLog }) => {
  smartLog.log('Navigating...');
  await page.goto('https://example.com');
  smartLog.log('Done');
});
```

### Step 4: Replace `console.*` with `smartLog.*`

| Before (console) | After (smartLog) |
|-------------------|-----------------|
| `console.log(...)` | `smartLog.log(...)` |
| `console.info(...)` | `smartLog.info(...)` |
| `console.warn(...)` | `smartLog.warn(...)` |
| `console.error(...)` | `smartLog.error(...)` |
| `console.debug(...)` | `smartLog.debug(...)` |
| `console.group(...)` | `smartLog.group(...)` |
| `console.groupEnd()` | `smartLog.groupEnd()` |
| `console.table(...)` | `smartLog.table(...)` |
| `console.dir(...)` | `smartLog.dir(...)` |
| `console.time(...)` | `smartLog.time(...)` |
| `console.timeEnd(...)` | `smartLog.timeEnd(...)` |
| `console.timeLog(...)` | `smartLog.timeLog(...)` |
| `console.assert(...)` | `smartLog.assert(...)` |
| `console.count(...)` | `smartLog.count(...)` |
| `console.countReset(...)` | `smartLog.countReset(...)` |
| `console.trace(...)` | `smartLog.trace(...)` |
| `console.clear()` | `smartLog.clear()` |

The API is identical to `console`, so the migration is a straightforward rename.

### Step 5: Configure (Optional)

Add smart logger options to `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';
import type { SmartLogOptions } from 'playwright-smart-logger';

export default defineConfig({
  use: {
    smartLog: {
      flushOn: ['fail', 'retry'],  // When to show logs
      maxBufferSize: 1000,          // Max buffered entries
      capturePageConsole: false,    // Capture browser console
    } as SmartLogOptions,
  },
});
```

---

## Before / After

### Before: Noisy Output

```typescript
import { test, expect } from '@playwright/test';

test('checkout flow', async ({ page }) => {
  console.log('Starting checkout test');
  await page.goto('https://shop.com');

  console.log('Adding item to cart');
  await page.click('.add-to-cart');

  console.log('Proceeding to checkout');
  await page.click('.checkout');

  console.log('Filling payment info');
  await page.fill('#card', '4242424242424242');

  console.log('Submitting order');
  await page.click('#submit');

  expect(await page.title()).toContain('Confirmation');
});
```

**Output (every run, pass or fail):**
```
Starting checkout test
Adding item to cart
Proceeding to checkout
Filling payment info
Submitting order
```

### After: Clean Output

```typescript
import { test, expect } from 'playwright-smart-logger';

test('checkout flow', async ({ page, smartLog }) => {
  smartLog.log('Starting checkout test');
  await page.goto('https://shop.com');

  smartLog.log('Adding item to cart');
  await page.click('.add-to-cart');

  smartLog.log('Proceeding to checkout');
  await page.click('.checkout');

  smartLog.log('Filling payment info');
  await page.fill('#card', '4242424242424242');

  smartLog.log('Submitting order');
  await page.click('#submit');

  expect(await page.title()).toContain('Confirmation');
});
```

**Output on pass:** _(nothing)_

**Output on fail:** All logs displayed with timestamps, colors, and attached to the HTML report.

---

## Gradual Adoption

Smart Logger does not override `console` globally. You can adopt it file by file:

```
tests/
  auth.spec.ts          <- uses playwright-smart-logger
  checkout.spec.ts      <- uses playwright-smart-logger
  legacy/
    old-tests.spec.ts   <- still uses @playwright/test (works fine)
```

Both import styles work in the same project. Tests using `@playwright/test` continue to work normally. There are no global side effects.

---

## Configuration for Different Environments

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

---

## Troubleshooting

### "I see no output when my test fails"

Check that `'fail'` is in your `flushOn` array:

```typescript
smartLog: {
  flushOn: ['fail'],  // Must include 'fail'
}
```

Also verify you're importing from `playwright-smart-logger`, not `@playwright/test`:

```typescript
import { test, expect } from 'playwright-smart-logger'; // correct
```

### "TypeScript errors in config"

Add a type assertion:

```typescript
smartLog: {
  flushOn: ['fail', 'retry'],
} as SmartLogOptions,
```

### "I want to see logs even when tests pass"

Add `'pass'` to `flushOn`:

```typescript
smartLog: {
  flushOn: ['fail', 'pass', 'retry'],
}
```

### "Buffer is getting too large"

Reduce `maxBufferSize` or call `smartLog.clear()` between phases:

```typescript
smartLog: {
  maxBufferSize: 500,
}
```

---

## Rollback

To stop using Smart Logger, change imports back:

```typescript
// Revert to standard Playwright
import { test, expect } from '@playwright/test';
```

Replace `smartLog.*` calls with `console.*` and remove `smartLog` from test signatures. Remove the `smartLog` config from `playwright.config.ts`. No other changes needed.
