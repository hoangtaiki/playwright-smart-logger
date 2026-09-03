import { test, expect } from '../src/smart-log';

function getSmartLogConfig() {
  return (test.info().project.use as any)?.smartLog ?? {};
}

test.describe('SmartLog - captureNetworkErrors', () => {
  test.describe('When captureNetworkErrors is enabled', () => {
    test('logs 500 responses as error entries with [Network 500] prefix', async ({
      page,
      smartLog,
    }) => {
      test.skip(
        !getSmartLogConfig().captureNetworkErrors,
        'Requires captureNetworkErrors: true'
      );

      await page.route('https://mock.test/api/test-500', route =>
        route.fulfill({ status: 500, body: '' })
      );
      await page.goto('data:text/html,<html><body></body></html>');
      await page.evaluate(() =>
        fetch('https://mock.test/api/test-500').catch(() => {})
      );
      await page.waitForTimeout(200);

      const buffer = smartLog.getBuffer();
      const networkEntries = buffer.filter(
        e =>
          e.source === 'browser' && String(e.args[0]).includes('[Network 500]')
      );
      expect(networkEntries).toHaveLength(1);
      expect(networkEntries[0].level).toBe('error');
      expect(String(networkEntries[0].args[0])).toContain('GET');
      expect(String(networkEntries[0].args[0])).toContain(
        'mock.test/api/test-500'
      );
    });

    test('logs 400 responses when threshold is 400', async ({
      page,
      smartLog,
    }) => {
      test.skip(
        !getSmartLogConfig().captureNetworkErrors,
        'Requires captureNetworkErrors: true'
      );
      test.skip(
        (getSmartLogConfig().captureNetworkErrorThreshold ?? 400) > 400,
        'Requires threshold <= 400'
      );

      await page.route('https://mock.test/api/test-400', route =>
        route.fulfill({ status: 400, body: '' })
      );
      await page.goto('data:text/html,<html><body></body></html>');
      await page.evaluate(() =>
        fetch('https://mock.test/api/test-400').catch(() => {})
      );
      await page.waitForTimeout(200);

      const buffer = smartLog.getBuffer();
      const networkEntries = buffer.filter(
        e =>
          e.source === 'browser' && String(e.args[0]).includes('[Network 400]')
      );
      expect(networkEntries).toHaveLength(1);
    });

    test('logs 422 responses when threshold is 400', async ({
      page,
      smartLog,
    }) => {
      test.skip(
        !getSmartLogConfig().captureNetworkErrors,
        'Requires captureNetworkErrors: true'
      );
      test.skip(
        (getSmartLogConfig().captureNetworkErrorThreshold ?? 400) > 422,
        'Requires threshold <= 422'
      );

      await page.route('https://mock.test/api/test-422', route =>
        route.fulfill({ status: 422, body: '' })
      );
      await page.goto('data:text/html,<html><body></body></html>');
      await page.evaluate(() =>
        fetch('https://mock.test/api/test-422').catch(() => {})
      );
      await page.waitForTimeout(200);

      const buffer = smartLog.getBuffer();
      const networkEntries = buffer.filter(
        e =>
          e.source === 'browser' && String(e.args[0]).includes('[Network 422]')
      );
      expect(networkEntries).toHaveLength(1);
    });

    test('does not log 200 responses', async ({ page, smartLog }) => {
      test.skip(
        !getSmartLogConfig().captureNetworkErrors,
        'Requires captureNetworkErrors: true'
      );

      await page.route('https://mock.test/api/test-200', route =>
        route.fulfill({ status: 200, body: '{}' })
      );
      await page.goto('data:text/html,<html><body></body></html>');
      await page.evaluate(() => fetch('https://mock.test/api/test-200'));
      await page.waitForTimeout(200);

      const buffer = smartLog.getBuffer();
      const networkEntries = buffer.filter(
        e => e.source === 'browser' && String(e.args[0]).startsWith('[Network')
      );
      expect(networkEntries).toHaveLength(0);
    });

    test('does not log 400 responses when threshold is 500', async ({
      page,
      smartLog,
    }) => {
      test.skip(
        !getSmartLogConfig().captureNetworkErrors,
        'Requires captureNetworkErrors: true'
      );
      test.skip(
        (getSmartLogConfig().captureNetworkErrorThreshold ?? 400) < 500,
        'Requires threshold >= 500'
      );

      await page.route('https://mock.test/api/test-400b', route =>
        route.fulfill({ status: 400, body: '' })
      );
      await page.goto('data:text/html,<html><body></body></html>');
      await page.evaluate(() =>
        fetch('https://mock.test/api/test-400b').catch(() => {})
      );
      await page.waitForTimeout(200);

      const buffer = smartLog.getBuffer();
      const networkEntries = buffer.filter(
        e =>
          e.source === 'browser' && String(e.args[0]).includes('[Network 400]')
      );
      expect(networkEntries).toHaveLength(0);
    });
  });

  test.describe('When captureNetworkErrors is disabled (default)', () => {
    test('does not log network responses', async ({ page, smartLog }) => {
      test.skip(
        !!getSmartLogConfig().captureNetworkErrors,
        'This test is for captureNetworkErrors: false'
      );

      await page.route('https://mock.test/api/test-500c', route =>
        route.fulfill({ status: 500, body: '' })
      );
      await page.goto('data:text/html,<html><body></body></html>');
      await page.evaluate(() =>
        fetch('https://mock.test/api/test-500c').catch(() => {})
      );
      await page.waitForTimeout(200);

      const buffer = smartLog.getBuffer();
      const networkEntries = buffer.filter(
        e => e.source === 'browser' && String(e.args[0]).startsWith('[Network')
      );
      expect(networkEntries).toHaveLength(0);
    });
  });
});
