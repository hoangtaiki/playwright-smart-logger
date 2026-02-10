import { test, expect } from '../src/smart-log-fixture';

test.describe('Smart Logger Examples', () => {

  test('basic logging that only appears on failure', async ({ page, smartLog }) => {
    smartLog.info('Starting test execution');
    smartLog.info('Navigating to example page');

    await page.goto('https://example.com');

    smartLog.info('Page loaded successfully');
    smartLog.warn('This warning will only show if test fails');

    // Test passes - no console output should appear
    expect(await page.title()).toBeTruthy();

    smartLog.info('Test completed successfully');
  });

  test('organized logging with groups', async ({ page, smartLog }) => {
    smartLog.group('Navigation Phase');
    smartLog.debug('Opening browser');
    smartLog.debug('Navigating to page');
    await page.goto('https://example.com');
    smartLog.info('Navigation complete');
    smartLog.groupEnd();

    smartLog.group('Validation Phase');
    const title = await page.title();
    smartLog.info(`Found title: ${title}`);
    smartLog.debug('Checking page content');
    smartLog.groupEnd();

    smartLog.info('All phases completed');
    expect(title).toBeTruthy();
  });

  test('data logging with tables and objects', async ({ page, smartLog }) => {
    await page.goto('https://example.com');

    // Log structured data as table
    const testData = [
      { step: 1, action: 'navigate', status: 'complete' },
      { step: 2, action: 'validate', status: 'pending' },
    ];
    smartLog.table(testData, ['step', 'action', 'status']);

    // Log objects with dir
    const pageInfo = {
      url: page.url(),
      title: await page.title(),
      timestamp: new Date().toISOString(),
    };
    smartLog.dir(pageInfo);

    smartLog.info('Data logging complete');
    expect(pageInfo.title).toBeTruthy();
  });

  test('performance timing', async ({ page, smartLog }) => {
    smartLog.time('page-load');
    smartLog.info('Starting page load timing');

    await page.goto('https://example.com');
    smartLog.timeLog('page-load', 'navigation complete');

    await page.waitForLoadState('networkidle');
    smartLog.timeEnd('page-load');

    smartLog.info('Performance timing completed');
    expect(await page.isVisible('body')).toBe(true);
  });

  test('assertion logging for inline validation', async ({ page, smartLog }) => {
    await page.goto('https://example.com');

    const title = await page.title();
    smartLog.assert(title.length > 0, 'Page should have a title');
    smartLog.assert(page.url().includes('example'), 'URL should contain "example"');

    // This assertion won't log anything (condition is true)
    smartLog.assert(true, 'This should not appear in logs');

    smartLog.info('All assertions passed');
    expect(title).toBeTruthy();
  });

  test('counter usage for loop tracking', async ({ page, smartLog }) => {
    await page.goto('https://example.com');

    const elements = await page.locator('*').count();
    smartLog.info(`Found ${elements} elements on page`);

    // Count specific element types
    for (const tag of ['h1', 'p', 'a', 'div']) {
      const count = await page.locator(tag).count();
      if (count > 0) {
        smartLog.count('elements-found');
        smartLog.info(`${tag}: ${count} found`);
      }
    }

    smartLog.countReset('elements-found');
    smartLog.info('Element scanning complete');

    expect(elements).toBeGreaterThan(0);
  });

  test('failing test to demonstrate log output', async ({ page, smartLog }) => {
    test.fail();

    smartLog.info('This test will fail to demonstrate log flushing');
    smartLog.warn('Warning: This is an intentional failure');

    await page.goto('https://example.com');

    smartLog.group('Validation Steps');
    smartLog.debug('Step 1: Check page title');
    smartLog.debug('Step 2: Verify element exists');
    smartLog.error('Step 3: This step will fail');
    smartLog.groupEnd();

    // Intentional failure - logs should be flushed
    expect(await page.title()).toBe('This Will Not Match');
  });

  test('trace for debugging call paths', async ({ smartLog }) => {
    smartLog.info('Starting trace demonstration');
    smartLog.trace('execution checkpoint');

    smartLog.info('Trace demonstration complete');

    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBe(3);
    // Verify trace entry contains stack info
    const traceEntry = buffer.find(e => e.args[0] === 'Trace:');
    expect(traceEntry).toBeDefined();
  });
});
