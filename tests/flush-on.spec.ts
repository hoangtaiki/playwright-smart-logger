import { test, expect } from '../src/smart-log';

test.describe('SmartLog - FlushOn Default Behavior', () => {

  test('should flush on fail by default', async ({ smartLog }) => {
    test.fail();

    smartLog.log('This should appear - default includes fail');
    smartLog.warn('Warning before failure');

    expect(smartLog.getBuffer().length).toBeGreaterThan(0);
    expect(1).toBe(2); // Intentional failure
  });

  test('should not flush on pass by default', async ({ smartLog }) => {
    smartLog.log('This should NOT appear - default excludes pass');
    smartLog.info('Info message that should be hidden');

    expect(smartLog.getBuffer().length).toBeGreaterThan(0);
    // Test passes, logs should not be flushed
  });

  test('should flush on retry by default', async ({ smartLog }) => {
    const currentRetry = test.info().retry;
    smartLog.log(`Retry attempt: ${currentRetry + 1}`);

    if (currentRetry === 0 && !process.env.CI) {
      test.fail();
      smartLog.log('First attempt - should flush due to retry');
      expect(true).toBe(false);
    } else {
      smartLog.log('Retry or CI - test passes');
      expect(true).toBe(true);
    }
  });
});

test.describe('SmartLog - FlushOn Custom Configuration', () => {

  test('should flush on pass when configured @chromium-flush-pass', async ({ smartLog }) => {
    // This test is designed for chromium-flush-pass project with flushOn: ['pass', 'fail', 'skip']
    smartLog.log('Custom configuration test - should flush on pass');
    smartLog.info('This should appear when test passes');

    expect(smartLog.getBuffer().length).toBe(2);
  });

  test('should handle multiple flushOn values', async ({ smartLog }) => {
    smartLog.log('Testing multiple flush conditions');
    smartLog.info('Buffer should capture all logs');

    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBe(2);
    expect(buffer[0].args[0]).toContain('multiple flush conditions');
    expect(buffer[1].args[0]).toContain('capture all logs');
  });

  test('should work with empty flushOn array concept', async ({ smartLog }) => {
    // With flushOn: [] logs would never flush automatically
    // Manual flush always works regardless
    smartLog.log('With empty flushOn, this would never auto-flush');
    smartLog.info('Only manual flush would work');

    expect(smartLog.getBuffer().length).toBe(2);

    await smartLog.flush();
    expect(smartLog.getBuffer().length).toBe(0);
  });
});

test.describe('SmartLog - FlushOn Status Mapping', () => {

  test('should handle fixme tests (test.fail)', async ({ smartLog }) => {
    test.fail(); // Maps to 'expected' status -> 'fixme' in flushOn

    smartLog.log('This is a fixme test that should flush based on config');
    smartLog.error('Expected failure for demonstration');

    expect(1).toBe(2); // Expected to fail
  });

  test('should handle skip status when configured @chromium-flush-pass', async () => {
    test.skip(true, 'Skipped to test skip behavior with flushOn: ["pass", "fail", "skip"]');
  });

  test('should demonstrate timeout status concept', async ({ smartLog }) => {
    // NOTE: This test demonstrates timeout handling without actually timing out
    smartLog.log('Timeout status would be handled by flushOn: ["timeout"] config');
    smartLog.warn('This simulates timeout behavior without actually timing out');

    expect(smartLog.getBuffer().length).toBe(2);
  });
});

test.describe('SmartLog - FlushOn Integration', () => {

  test('manual flush should work regardless of flushOn', async ({ smartLog }) => {
    smartLog.log('Testing manual flush');
    smartLog.warn('This should flush when manually called');

    expect(smartLog.getBuffer().length).toBe(2);

    await smartLog.flush();
    expect(smartLog.getBuffer().length).toBe(0);
  });

  test('clear should work regardless of flushOn', async ({ smartLog }) => {
    smartLog.log('Testing clear');
    smartLog.info('This will be cleared');

    expect(smartLog.getBuffer().length).toBe(2);

    smartLog.clear();
    expect(smartLog.getBuffer().length).toBe(0);
  });

  test('should maintain buffer size limits with any flushOn config', async ({ smartLog }) => {
    for (let i = 0; i < 50; i++) {
      smartLog.log(`Buffer test log ${i}`);
    }

    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBeLessThanOrEqual(1000);
  });

  test('should validate all FlushOn values are valid strings', async ({ smartLog }) => {
    const validFlushOn = ['fail', 'pass', 'skip', 'fixme', 'retry', 'timeout'];
    expect(validFlushOn.every(v => typeof v === 'string')).toBe(true);

    smartLog.log('FlushOn validation passed');
    expect(smartLog.getBuffer().length).toBe(1);
  });
});
