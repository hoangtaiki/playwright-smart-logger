import { test, expect } from '../src/smart-log';

test.describe('SmartLog - Configuration Options', () => {
  test.describe('AttachToReport Option', () => {
    test('should attach logs to report when enabled', async ({ smartLog }) => {
      test.skip(
        !(test.info().project.use as any)?.smartLogOptions?.attachToReport,
        'Requires attachToReport: true'
      );

      smartLog.log('Log entry for attachment');
      smartLog.warn('Warning entry');
      smartLog.error('Error entry');

      await smartLog.flush();
      expect(smartLog.getBuffer()).toHaveLength(0);

      const attachments = test.info().attachments;
      const smartLogAttachment = attachments.find(a => a.name === 'smart-log');

      expect(smartLogAttachment).toBeDefined();
      expect(smartLogAttachment!.contentType).toBe('text/plain');
      expect(smartLogAttachment!.body).toBeInstanceOf(Buffer);

      const content = smartLogAttachment!.body!.toString('utf-8');
      expect(content).toContain('Smart Logger Output');
      expect(content).toContain('Log entry for attachment');
      expect(content).toContain('[LOG]');
      expect(content).toContain('[WARN]');
      expect(content).toContain('[ERROR]');
    });

    test('should not attach when disabled (default)', async ({ smartLog }) => {
      const isAttachEnabled = (test.info().project.use as any)?.smartLogOptions
        ?.attachToReport;
      test.skip(!!isAttachEnabled, 'This test is for attachToReport: false');

      smartLog.log('This should not be attached');
      await smartLog.flush();

      const attachments = test.info().attachments;
      const smartLogAttachment = attachments.find(a => a.name === 'smart-log');
      expect(smartLogAttachment).toBeUndefined();
    });

    test('should not attach empty buffer', async ({ smartLog }) => {
      test.skip(
        !(test.info().project.use as any)?.smartLogOptions?.attachToReport,
        'Requires attachToReport: true'
      );

      await smartLog.flush(); // No logs

      const attachments = test.info().attachments;
      const smartLogAttachment = attachments.find(a => a.name === 'smart-log');
      expect(smartLogAttachment).toBeUndefined();
    });

    test('should include test title in attachment', async ({ smartLog }) => {
      test.skip(
        !(test.info().project.use as any)?.smartLogOptions?.attachToReport,
        'Requires attachToReport: true'
      );

      smartLog.info('Test title check');
      await smartLog.flush();

      const attachments = test.info().attachments;
      const smartLogAttachment = attachments.find(a => a.name === 'smart-log');
      expect(smartLogAttachment).toBeDefined();

      const content = smartLogAttachment!.body!.toString('utf-8');
      expect(content).toContain(test.info().title);
    });

    test('should create separate attachments on multiple flushes', async ({
      smartLog,
    }) => {
      test.skip(
        !(test.info().project.use as any)?.smartLogOptions?.attachToReport,
        'Requires attachToReport: true'
      );

      smartLog.log('first batch');
      await smartLog.flush();

      smartLog.log('second batch');
      await smartLog.flush();

      const attachments = test.info().attachments;
      const smartLogAttachments = attachments.filter(
        a => a.name === 'smart-log'
      );
      expect(smartLogAttachments).toHaveLength(2);

      const firstContent = smartLogAttachments[0].body!.toString('utf-8');
      const secondContent = smartLogAttachments[1].body!.toString('utf-8');
      expect(firstContent).toContain('first batch');
      expect(secondContent).toContain('second batch');
    });
  });

  test.describe('Browser Console Capture Option', () => {
    test('should capture browser console when enabled', async ({
      page,
      smartLog,
    }) => {
      test.skip(
        !(test.info().project.use as any)?.smartLogOptions?.capturePageConsole,
        'Requires capturePageConsole: true'
      );

      await page.goto('data:text/html,<html><body></body></html>');

      await page.evaluate(() => {
        console.log('Browser log message');
        console.warn('Browser warning');
        console.error('Browser error');
      });

      await page.waitForTimeout(200);

      const buffer = smartLog.getBuffer();
      const browserLogs = buffer.filter(entry => entry.source === 'browser');

      expect(browserLogs.length).toBeGreaterThanOrEqual(3);
      expect(
        browserLogs.some(log =>
          log.args.some(a => String(a).includes('Browser log message'))
        )
      ).toBe(true);
      expect(
        browserLogs.some(log =>
          log.args.some(a => String(a).includes('Browser warning'))
        )
      ).toBe(true);
    });

    test('should map browser log levels correctly', async ({
      page,
      smartLog,
    }) => {
      test.skip(
        !(test.info().project.use as any)?.smartLogOptions?.capturePageConsole,
        'Requires capturePageConsole: true'
      );

      await page.goto('data:text/html,<html><body></body></html>');

      await page.evaluate(() => {
        console.log('log-msg');
        console.warn('warn-msg');
        console.error('error-msg');
        console.info('info-msg');
      });

      await page.waitForTimeout(200);

      const buffer = smartLog.getBuffer();
      const browserLogs = buffer.filter(entry => entry.source === 'browser');

      const logEntry = browserLogs.find(e =>
        e.args.some(a => String(a).includes('log-msg'))
      );
      const warnEntry = browserLogs.find(e =>
        e.args.some(a => String(a).includes('warn-msg'))
      );
      const errorEntry = browserLogs.find(e =>
        e.args.some(a => String(a).includes('error-msg'))
      );
      const infoEntry = browserLogs.find(e =>
        e.args.some(a => String(a).includes('info-msg'))
      );

      expect(logEntry?.level).toBe('log');
      expect(warnEntry?.level).toBe('warn');
      expect(errorEntry?.level).toBe('error');
      expect(infoEntry?.level).toBe('info');
    });

    test('should not capture when disabled (default)', async ({
      page,
      smartLog,
    }) => {
      const isCaptureEnabled = (test.info().project.use as any)?.smartLogOptions
        ?.capturePageConsole;
      test.skip(
        !!isCaptureEnabled,
        'This test is for capturePageConsole: false'
      );

      await page.goto(
        'data:text/html,<script>console.log("should not be captured")</script>'
      );
      await page.waitForTimeout(100);

      const buffer = smartLog.getBuffer();
      const browserLogs = buffer.filter(entry => entry.source === 'browser');
      expect(browserLogs).toHaveLength(0);
    });
  });

  test.describe('Buffer Size Limits', () => {
    test('should respect maxBufferSize configuration', async ({ smartLog }) => {
      // Test with default maxBufferSize (1000)
      for (let i = 0; i < 1100; i++) {
        smartLog.log(`entry ${i}`);
      }

      const buffer = smartLog.getBuffer();
      expect(buffer.length).toBeLessThanOrEqual(1000);
      expect(buffer[buffer.length - 1].args[0]).toBe('entry 1099');
    });
  });

  // smartLogOptions is an option fixture, the only kind Playwright 1.60+ lets a config `use` section (or
  // test.use()) set. The legacy `use.smartLog` key is rejected there.
  test.describe('smartLogOptions', () => {
    test.describe('set with test.use()', () => {
      test.use({ smartLogOptions: { maxBufferSize: 2 } });

      test('should reach the logger', async ({ smartLog }) => {
        smartLog.info('one');
        smartLog.info('two');
        smartLog.info('three');

        const messages = smartLog.getBuffer().map(e => String(e.args[0]));
        expect(messages).toEqual(['two', 'three']);
      });
    });

    test.describe('set to an empty object', () => {
      test.use({ smartLogOptions: {} });

      // The config value (1000) is also the default, so the boundary is what tells "defaults applied" from
      // "nothing applied": without the default the buffer would never be trimmed.
      test('should apply the defaults', async ({ smartLog }) => {
        for (let i = 0; i < 1001; i++) smartLog.log(`entry ${i}`);

        const buffer = smartLog.getBuffer();
        expect(buffer).toHaveLength(1000);
        expect(buffer[0].args[0]).toBe('entry 1');
      });
    });

    test('should use the deprecated smartLog key when only that is set @legacy-smartlog', async ({
      smartLog,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== 'chromium-legacy-smartlog',
        'Requires the project that sets only the legacy key (Playwright before 1.60)'
      );

      for (let i = 0; i < 5; i++) smartLog.info(`entry ${i}`);

      expect(smartLog.getBuffer().map(e => String(e.args[0]))).toEqual([
        'entry 2',
        'entry 3',
        'entry 4',
      ]);
    });
  });
});
