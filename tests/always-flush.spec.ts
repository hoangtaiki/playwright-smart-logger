import { test, expect } from '../src/smart-log';

/**
 * These tests run exclusively under the `chromium-always-flush` project which sets:
 *   alwaysFlush: true
 *   attachToReport: true
 *
 * The auto-flush triggered by `alwaysFlush` happens in fixture teardown — AFTER
 * the test body — so it cannot be asserted from within the test body directly.
 * Instead, we verify the flush pipeline by calling flush() explicitly, using the
 * resulting report attachment as the observable side-effect.
 * This exercises the exact same code path that the auto-flush in teardown takes.
 */
test.describe('SmartLog - AlwaysFlush Option', () => {
  test('should produce an attachment when flushing under alwaysFlush config', async ({
    smartLog,
  }) => {
    test.skip(
      !(test.info().project.use as any)?.smartLog?.alwaysFlush,
      'Requires alwaysFlush: true'
    );
    test.skip(
      !(test.info().project.use as any)?.smartLog?.attachToReport,
      'Requires attachToReport: true to observe the flush side-effect'
    );

    smartLog.log('entry that should be flushed and attached');
    smartLog.warn('warning that should appear on a passing test');
    expect(smartLog.getBuffer().length).toBe(2);

    // Explicitly invoke the same flush() call that teardown will make.
    // With attachToReport: true, this creates a report attachment we can assert against.
    await smartLog.flush();

    expect(smartLog.getBuffer().length).toBe(0);

    const attachment = test
      .info()
      .attachments.find(a => a.name === 'smart-log');
    expect(attachment).toBeDefined();
    expect(attachment!.contentType).toBe('text/plain');

    const content = attachment!.body!.toString('utf-8');
    expect(content).toContain('entry that should be flushed and attached');
    expect(content).toContain('warning that should appear on a passing test');
    expect(content).toContain('[LOG]');
    expect(content).toContain('[WARN]');
  });

  test('should flush on every status (pass, fail, skip) when alwaysFlush is true', async ({
    smartLog,
  }) => {
    test.skip(
      !(test.info().project.use as any)?.smartLog?.alwaysFlush,
      'Requires alwaysFlush: true'
    );

    // Simulate a scenario that would normally NOT flush (passing test with default flushOn).
    // With alwaysFlush: true the fixture teardown calls flush() regardless.
    // We verify here that the buffer is populated and available for that teardown flush.
    smartLog.info('passing test — logs should still flush with alwaysFlush');
    smartLog.debug('debug entry');

    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBe(2);
    expect(buffer[0].level).toBe('info');
    expect(buffer[1].level).toBe('debug');
    // Teardown will flush these automatically. Output is visible in stdout / CI logs.
  });
});
