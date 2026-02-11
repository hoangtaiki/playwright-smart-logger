import { test, expect } from '../src/smart-log';

test.describe('SmartLog - Examples & Integration Tests', () => {

test.describe('Real-world Usage Patterns', () => {

  test('basic logging that appears only on failure', async ({ page, smartLog }) => {
    smartLog.info('Starting test execution');
    smartLog.info('Navigating to example page');

    await page.goto('https://example.com');

    smartLog.info('Page loaded successfully');
    smartLog.warn('This warning will only show if test fails');

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

    const testData = [
      { step: 1, action: 'navigate', status: 'complete' },
      { step: 2, action: 'validate', status: 'complete' },
    ];
    smartLog.table(testData, ['step', 'action', 'status']);

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
    smartLog.assert(true, 'This should not appear in logs');

    smartLog.info('All assertions passed');
    expect(title).toBeTruthy();
  });

  test('counter usage for iterative operations', async ({ page, smartLog }) => {
    await page.goto('https://example.com');

    const elements = await page.locator('*').count();
    smartLog.info(`Found ${elements} elements on page`);

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
});

test.describe('Error Scenarios', () => {

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

    expect(await page.title()).toBe('This Will Not Match');
  });
});

test.describe('Advanced Features', () => {

  test('trace for debugging call paths', async ({ smartLog }) => {
    function nestedFunction() {
      smartLog.trace('execution checkpoint');
    }
    
    smartLog.info('Starting trace demonstration');
    nestedFunction();
    smartLog.info('Trace demonstration complete');

    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBe(3);
    
    const traceEntry = buffer.find(e => e.args[0] === 'Trace:');
    expect(traceEntry).toBeDefined();
    expect(traceEntry!.args[traceEntry!.args.length - 1]).toContain('at');
  });

  test('complex data structures', async ({ smartLog }) => {
    const complexData = {
      users: [
        { id: 1, name: 'Alice', roles: ['admin', 'user'] },
        { id: 2, name: 'Bob', roles: ['user'] },
      ],
      metadata: {
        version: '1.0.0',
        created: new Date('2023-01-01'),
        features: new Set(['auth', 'logging']),
      },
    };

    smartLog.group('Processing Complex Data');
    smartLog.table(complexData.users);
    smartLog.dir(complexData.metadata);
    smartLog.groupEnd();

    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBeGreaterThan(2);
  });

  test('error handling with logs', async ({ page, smartLog }) => {
    smartLog.info('Testing error handling');

    try {
      // Simulate an error without network calls
      throw new Error('Simulated error for testing');
    } catch (error) {
      smartLog.error('Error handled successfully:', error);
      smartLog.info('Continuing with next steps');
    }

    // Continue with a simple working navigation
    await page.goto('https://example.com');
    smartLog.info('Navigation succeeded');

    expect(await page.title()).toBeTruthy();
  });
});

test.describe('Integration with Page Objects', () => {

  class TestPage {
    constructor(private page: any, private smartLog: any) {}

    async navigate(url: string) {
      this.smartLog.group(`Navigating to ${url}`);
      this.smartLog.info('Starting navigation');
      await this.page.goto(url);
      this.smartLog.info('Navigation completed');
      this.smartLog.groupEnd();
    }

    async validateTitle(expectedPattern: RegExp) {
      this.smartLog.info('Validating page title');
      const title = await this.page.title();
      this.smartLog.info(`Found title: "${title}"`);
      
      const matches = expectedPattern.test(title);
      this.smartLog.assert(matches, `Title should match pattern: ${expectedPattern}`);
      
      return matches;
    }
  }

  test('should work with page objects', async ({ page, smartLog }) => {
    const testPage = new TestPage(page, smartLog);

    await testPage.navigate('https://example.com');
    const isValid = await testPage.validateTitle(/Example/i);

    expect(isValid).toBe(true);

    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBeGreaterThan(3);
  });
});

});