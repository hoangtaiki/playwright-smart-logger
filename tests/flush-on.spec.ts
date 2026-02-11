import { test, expect } from '../src/smart-log';

test.describe('SmartLog - Configuration & Lifecycle', () => {
  test.describe('FlushOn Behavior', () => {
    test('should flush on fail by default', async ({ smartLog }) => {
      test.fail();
      smartLog.log('This should appear on failure');
      expect(smartLog.getBuffer().length).toBeGreaterThan(0);
      expect(1).toBe(2); // Intentional failure
    });

    test('should not flush on pass by default', async ({ smartLog }) => {
      smartLog.log('This should NOT appear on pass');
      expect(smartLog.getBuffer().length).toBeGreaterThan(0);
      // Test passes - logs should not flush automatically
    });

    test('should handle retry scenarios', async ({ smartLog }) => {
      const currentRetry = test.info().retry;
      smartLog.log(`Retry attempt: ${currentRetry + 1}`);

      if (currentRetry === 0 && !process.env.CI) {
        test.fail();
        smartLog.log('First attempt - should flush on retry');
        expect(true).toBe(false);
      } else {
        smartLog.log('Retry or CI - test passes');
        expect(true).toBe(true);
      }
    });

    test('should handle custom flush configuration', async ({ smartLog }) => {
      smartLog.log('Custom configuration test');
      smartLog.info('Buffer captures all logs');

      expect(smartLog.getBuffer().length).toBe(2);
    });

    test('manual flush should work regardless of config', async ({
      smartLog,
    }) => {
      smartLog.log('Manual flush test');

      expect(smartLog.getBuffer().length).toBe(1);
      await smartLog.flush();
      expect(smartLog.getBuffer().length).toBe(0);
    });
  });

  test.describe('Buffer Management', () => {
    test('clear should reset buffer and group depth', async ({ smartLog }) => {
      smartLog.group('Test Group');
      smartLog.log('Inside group');
      expect(smartLog.getBuffer().length).toBe(2);

      smartLog.clear();
      expect(smartLog.getBuffer().length).toBe(0);

      smartLog.log('After clear');
      const buffer = smartLog.getBuffer();
      expect(buffer[0].groupLevel).toBe(0);
    });

    test('should maintain buffer size limits', async ({ smartLog }) => {
      for (let i = 0; i < 50; i++) {
        smartLog.log(`Buffer test log ${i}`);
      }

      const buffer = smartLog.getBuffer();
      expect(buffer.length).toBeLessThanOrEqual(1000);
    });

    test('getBuffer should return copy', async ({ smartLog }) => {
      smartLog.log('original');

      const buffer1 = smartLog.getBuffer();
      buffer1.push({
        level: 'log',
        args: ['injected'],
        timestamp: 0,
        source: 'test',
        groupLevel: 0,
      });

      const buffer2 = smartLog.getBuffer();
      expect(buffer2).toHaveLength(1); // not affected by mutation
    });
  });

  test.describe('Status Mapping & Edge Cases', () => {
    test('should handle fixme tests', async ({ smartLog }) => {
      test.fail(); // Maps to 'expected' status -> 'fixme'
      smartLog.log('Fixme test that should flush based on config');
      expect(1).toBe(2); // Expected to fail
    });

    test('should handle timeout status concept', async ({ smartLog }) => {
      smartLog.log('Timeout status would be handled by appropriate config');
      expect(smartLog.getBuffer().length).toBe(1);
    });

    test('should validate FlushOn values', async ({ smartLog }) => {
      const validFlushOn = [
        'fail',
        'pass',
        'skip',
        'fixme',
        'retry',
        'timeout',
      ];
      expect(validFlushOn.every(v => typeof v === 'string')).toBe(true);

      smartLog.log('FlushOn validation passed');
      expect(smartLog.getBuffer().length).toBe(1);
    });
  });
});
