import { test, expect } from '../src/smart-log-fixture';

test.describe('SmartLog - Browser Console Capture', () => {

  test('should capture browser console.log when capturePageConsole is enabled', async ({ page, smartLog }) => {
    // This test runs under chromium-browser-console project with capturePageConsole: true
    test.skip(!(test.info().project.use as any)?.smartLog?.capturePageConsole, 'Requires capturePageConsole: true');

    await page.goto('data:text/html,<html><body><h1>Test</h1></body></html>');

    await page.evaluate(() => {
      console.log('Browser log message');
      console.warn('Browser warning');
      console.error('Browser error');
    });

    // Wait briefly for async console events to arrive
    await new Promise(resolve => setTimeout(resolve, 200));

    const buffer = smartLog.getBuffer();
    const browserLogs = buffer.filter(entry => entry.source === 'browser');

    expect(browserLogs.length).toBeGreaterThanOrEqual(3);
    expect(browserLogs.some(log => log.args.some(a => String(a).includes('Browser log message')))).toBe(true);
    expect(browserLogs.some(log => log.args.some(a => String(a).includes('Browser warning')))).toBe(true);
    expect(browserLogs.some(log => log.args.some(a => String(a).includes('Browser error')))).toBe(true);
  });

  test('should map browser log levels correctly', async ({ page, smartLog }) => {
    test.skip(!(test.info().project.use as any)?.smartLog?.capturePageConsole, 'Requires capturePageConsole: true');

    await page.goto('data:text/html,<html><body></body></html>');

    await page.evaluate(() => {
      console.log('log-msg');
      console.warn('warn-msg');
      console.error('error-msg');
      console.info('info-msg');
      console.debug('debug-msg');
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    const buffer = smartLog.getBuffer();
    const browserLogs = buffer.filter(entry => entry.source === 'browser');

    const logEntry = browserLogs.find(e => e.args.some(a => String(a).includes('log-msg')));
    const warnEntry = browserLogs.find(e => e.args.some(a => String(a).includes('warn-msg')));
    const errorEntry = browserLogs.find(e => e.args.some(a => String(a).includes('error-msg')));
    const infoEntry = browserLogs.find(e => e.args.some(a => String(a).includes('info-msg')));

    expect(logEntry?.level).toBe('log');
    expect(warnEntry?.level).toBe('warn');
    expect(errorEntry?.level).toBe('error');
    expect(infoEntry?.level).toBe('info');
  });

  test('should not capture browser console when disabled (default)', async ({ page, smartLog }) => {
    const isCaptureEnabled = (test.info().project.use as any)?.smartLog?.capturePageConsole;
    test.skip(!!isCaptureEnabled, 'This test is for capturePageConsole: false');

    await page.goto('data:text/html,<html><body></body></html>');

    await page.evaluate(() => {
      console.log('Browser log - should not be captured');
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    const buffer = smartLog.getBuffer();
    const browserLogs = buffer.filter(entry => entry.source === 'browser');
    expect(browserLogs).toHaveLength(0);
  });

  test('should handle browser console errors gracefully', async ({ page, smartLog }) => {
    test.skip(!(test.info().project.use as any)?.smartLog?.capturePageConsole, 'Requires capturePageConsole: true');

    await page.goto('data:text/html,<html><body></body></html>');

    // Log complex objects that may fail serialization
    await page.evaluate(() => {
      console.log('simple text');
      console.log(document.body); // DOM element - complex object
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    // Should not crash, should have at least the simple text entry
    const buffer = smartLog.getBuffer();
    const browserLogs = buffer.filter(entry => entry.source === 'browser');
    expect(browserLogs.length).toBeGreaterThanOrEqual(1);
  });
});

test.describe('SmartLog - Manual Flush', () => {

  test('manual flush should output and clear buffer', async ({ smartLog }) => {
    smartLog.log('entry 1');
    smartLog.info('entry 2');
    smartLog.warn('entry 3');

    expect(smartLog.getBuffer()).toHaveLength(3);

    await smartLog.flush();

    expect(smartLog.getBuffer()).toHaveLength(0);
  });

  test('manual flush on empty buffer should not error', async ({ smartLog }) => {
    expect(smartLog.getBuffer()).toHaveLength(0);
    await expect(smartLog.flush()).resolves.toBeUndefined();
  });

  test('multiple flushes should work', async ({ smartLog }) => {
    smartLog.log('batch 1');
    await smartLog.flush();
    expect(smartLog.getBuffer()).toHaveLength(0);

    smartLog.log('batch 2');
    await smartLog.flush();
    expect(smartLog.getBuffer()).toHaveLength(0);
  });
});

test.describe('SmartLog - Edge Cases', () => {

  test('should handle circular references in log args', async ({ smartLog }) => {
    const circular: any = { name: 'test' };
    circular.self = circular;

    expect(() => smartLog.log('circular:', circular)).not.toThrow();

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args[0]).toBe('circular:');
  });

  test('should handle Symbol in args', async ({ smartLog }) => {
    const sym = Symbol('test');
    expect(() => smartLog.log(sym)).not.toThrow();

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
  });

  test('should handle Error objects in args', async ({ smartLog }) => {
    const err = new Error('test error');
    smartLog.error('caught:', err);

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args[0]).toBe('caught:');
    expect(buffer[0].args[1]).toBeInstanceOf(Error);
  });

  test('should handle very large objects', async ({ smartLog }) => {
    const large: any = {};
    for (let i = 0; i < 1000; i++) {
      large[`key_${i}`] = `value_${i}`;
    }

    expect(() => smartLog.dir(large)).not.toThrow();
    expect(smartLog.getBuffer()).toHaveLength(1);
  });

  test('should handle rapid sequential calls', async ({ smartLog }) => {
    for (let i = 0; i < 500; i++) {
      smartLog.log(`rapid ${i}`);
    }

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(500);
    expect(buffer[0].args[0]).toBe('rapid 0');
    expect(buffer[499].args[0]).toBe('rapid 499');
  });

  test('should handle interleaved method calls', async ({ smartLog }) => {
    smartLog.group('Phase');
    smartLog.time('op');
    smartLog.count('items');
    smartLog.log('processing');
    smartLog.count('items');
    await new Promise(resolve => setTimeout(resolve, 10));
    smartLog.timeEnd('op');
    smartLog.countReset('items');
    smartLog.groupEnd();
    smartLog.log('done');

    const buffer = smartLog.getBuffer();
    // group header, count 1, log, count 2, timeEnd, log done
    expect(buffer.length).toBeGreaterThanOrEqual(5);

    // Verify group depth tracking
    const doneEntry = buffer.find(e => e.args[0] === 'done');
    expect(doneEntry?.groupLevel).toBe(0);
  });

  test('should handle undefined and null args', async ({ smartLog }) => {
    smartLog.log(undefined, null, 0, '', false);

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args).toEqual([undefined, null, 0, '', false]);
  });

  test('should handle table with circular references', async ({ smartLog }) => {
    const circular: any = { name: 'test' };
    circular.self = circular;

    expect(() => smartLog.table([circular])).not.toThrow();
    expect(smartLog.getBuffer()).toHaveLength(1);
  });

  test('should preserve arg types in buffer', async ({ smartLog }) => {
    const date = new Date();
    const regex = /test/;
    const arr = [1, 2, 3];
    const obj = { key: 'value' };

    smartLog.log(date, regex, arr, obj, 42, true, 'str');

    const buffer = smartLog.getBuffer();
    expect(buffer[0].args[0]).toBeInstanceOf(Date);
    expect(buffer[0].args[1]).toBeInstanceOf(RegExp);
    expect(buffer[0].args[2]).toEqual([1, 2, 3]);
    expect(buffer[0].args[3]).toEqual({ key: 'value' });
    expect(buffer[0].args[4]).toBe(42);
    expect(buffer[0].args[5]).toBe(true);
    expect(buffer[0].args[6]).toBe('str');
  });
});
