import { test, expect } from '../src/smart-log';

test.describe('SmartLog - AlwaysFlush Option', () => {
  test('should flush logs after a passing test when alwaysFlush is enabled', async ({
    smartLog,
  }) => {
    test.skip(
      !(test.info().project.use as any)?.smartLog?.alwaysFlush,
      'Requires alwaysFlush: true'
    );

    // Log some entries and let the fixture teardown flush them automatically.
    // If alwaysFlush is working, these appear in stdout even though the test passes.
    smartLog.log('alwaysFlush: visible on pass');
    smartLog.info('This should appear regardless of test outcome');

    expect(smartLog.getBuffer().length).toBe(2);
    // Do NOT manually flush — the auto-flush in teardown is what we are testing.
  });

  test('should not flush automatically on pass when alwaysFlush is disabled', async ({
    smartLog,
  }) => {
    const isAlwaysFlush = (test.info().project.use as any)?.smartLog
      ?.alwaysFlush;
    test.skip(!!isAlwaysFlush, 'This test is for alwaysFlush: false');

    smartLog.log('should not be flushed automatically on pass');
    expect(smartLog.getBuffer().length).toBe(1);
    // Buffer remains; teardown will not flush it when the test passes.
  });
});
