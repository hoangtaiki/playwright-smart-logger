import { test, expect } from '../src/smart-log';

test.describe('SmartLog - attachToReport Option', () => {

  test('should attach log output to report when attachToReport is enabled', async ({ smartLog }) => {
    test.skip(!(test.info().project.use as any)?.smartLog?.attachToReport, 'Requires attachToReport: true');

    smartLog.log('Log entry for attachment');
    smartLog.warn('Warning entry for attachment');
    smartLog.error('Error entry for attachment');

    expect(smartLog.getBuffer()).toHaveLength(3);

    await smartLog.flush();

    // Buffer should be cleared after flush
    expect(smartLog.getBuffer()).toHaveLength(0);

    // Verify attachment was added to testInfo
    const attachments = test.info().attachments;
    const smartLogAttachment = attachments.find(a => a.name === 'smart-log');

    expect(smartLogAttachment).toBeDefined();
    expect(smartLogAttachment!.contentType).toBe('text/plain');
    expect(smartLogAttachment!.body).toBeInstanceOf(Buffer);

    const content = smartLogAttachment!.body!.toString('utf-8');
    expect(content).toContain('Smart Logger Output');
    expect(content).toContain('Log entry for attachment');
    expect(content).toContain('Warning entry for attachment');
    expect(content).toContain('Error entry for attachment');
    expect(content).toContain('[LOG]');
    expect(content).toContain('[WARN]');
    expect(content).toContain('[ERROR]');
  });

  test('should not attach when attachToReport is disabled (default)', async ({ smartLog }) => {
    const isAttachEnabled = (test.info().project.use as any)?.smartLog?.attachToReport;
    test.skip(!!isAttachEnabled, 'This test is for attachToReport: false');

    smartLog.log('This should not be attached');

    await smartLog.flush();

    const attachments = test.info().attachments;
    const smartLogAttachment = attachments.find(a => a.name === 'smart-log');
    expect(smartLogAttachment).toBeUndefined();
  });

  test('should not attach on empty buffer flush', async ({ smartLog }) => {
    test.skip(!(test.info().project.use as any)?.smartLog?.attachToReport, 'Requires attachToReport: true');

    // Flush with no log entries
    await smartLog.flush();

    const attachments = test.info().attachments;
    const smartLogAttachment = attachments.find(a => a.name === 'smart-log');
    expect(smartLogAttachment).toBeUndefined();
  });

  test('should include test title in attachment header', async ({ smartLog }) => {
    test.skip(!(test.info().project.use as any)?.smartLog?.attachToReport, 'Requires attachToReport: true');

    smartLog.info('Test title check');

    await smartLog.flush();

    const attachments = test.info().attachments;
    const smartLogAttachment = attachments.find(a => a.name === 'smart-log');
    expect(smartLogAttachment).toBeDefined();

    const content = smartLogAttachment!.body!.toString('utf-8');
    expect(content).toContain(test.info().title);
  });

  test('should include grouped entries with indentation in attachment', async ({ smartLog }) => {
    test.skip(!(test.info().project.use as any)?.smartLog?.attachToReport, 'Requires attachToReport: true');

    smartLog.log('before group');
    smartLog.group('Group A');
    smartLog.info('inside group');
    smartLog.groupEnd();
    smartLog.log('after group');

    await smartLog.flush();

    const attachments = test.info().attachments;
    const smartLogAttachment = attachments.find(a => a.name === 'smart-log');
    expect(smartLogAttachment).toBeDefined();

    const content = smartLogAttachment!.body!.toString('utf-8');
    expect(content).toContain('before group');
    expect(content).toContain('Group A');
    expect(content).toContain('inside group');
    expect(content).toContain('after group');
  });

  test('should create separate attachments on multiple flushes', async ({ smartLog }) => {
    test.skip(!(test.info().project.use as any)?.smartLog?.attachToReport, 'Requires attachToReport: true');

    smartLog.log('first batch');
    await smartLog.flush();

    smartLog.log('second batch');
    await smartLog.flush();

    const attachments = test.info().attachments;
    const smartLogAttachments = attachments.filter(a => a.name === 'smart-log');
    expect(smartLogAttachments).toHaveLength(2);

    const firstContent = smartLogAttachments[0].body!.toString('utf-8');
    const secondContent = smartLogAttachments[1].body!.toString('utf-8');
    expect(firstContent).toContain('first batch');
    expect(secondContent).toContain('second batch');
  });
});
