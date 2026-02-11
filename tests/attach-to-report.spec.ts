import { test, expect } from '../src/smart-log';

test.describe('SmartLog - formatBufferForAttachment', () => {

  /**
   * Helper: flush and return the attachment content string.
   * Assumes attachToReport is enabled via the chromium-attach-report project.
   */
  async function getAttachmentContent(smartLog: any): Promise<string> {
    await smartLog.flush();
    const attachments = test.info().attachments;
    const smartLogAttachment = attachments.find((a: any) => a.name === 'smart-log');
    expect(smartLogAttachment).toBeDefined();
    expect(smartLogAttachment!.contentType).toBe('text/plain');
    return smartLogAttachment!.body!.toString('utf-8');
  }

  test.describe('Header and Footer', () => {

    test('should include test title in header', async ({ smartLog }) => {
      smartLog.log('entry');
      const content = await getAttachmentContent(smartLog);

      expect(content).toContain(`Smart Logger Output - ${test.info().title}`);
    });

    test('should include separator lines', async ({ smartLog }) => {
      smartLog.log('entry');
      const content = await getAttachmentContent(smartLog);

      const separator = '='.repeat(50);
      // Header separator
      expect(content.startsWith(`Smart Logger Output - ${test.info().title}\n${separator}\n\n`)).toBe(true);
      // Footer separator
      expect(content.endsWith('\n\n' + separator)).toBe(true);
    });
  });

  test.describe('Timestamp Formatting', () => {

    test('should format timestamp as HH:MM:SS.mmm', async ({ smartLog }) => {
      smartLog.log('timestamp test');
      const content = await getAttachmentContent(smartLog);

      // Timestamp is ISO time sliced [11,23] e.g. "12:34:56.789"
      expect(content).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
    });
  });

  test.describe('Log Level Labels', () => {

    test('should format all levels as uppercase', async ({ smartLog }) => {
      smartLog.log('log msg');
      smartLog.debug('debug msg');
      smartLog.info('info msg');
      smartLog.warn('warn msg');
      smartLog.error('error msg');

      const content = await getAttachmentContent(smartLog);

      expect(content).toContain('[LOG]');
      expect(content).toContain('[DEBUG]');
      expect(content).toContain('[INFO]');
      expect(content).toContain('[WARN]');
      expect(content).toContain('[ERROR]');
    });

    test('should pair level with message on same line', async ({ smartLog }) => {
      smartLog.info('specific message here');
      const content = await getAttachmentContent(smartLog);

      // Find the line with the entry
      const lines = content.split('\n');
      const entryLine = lines.find(l => l.includes('specific message here'));
      expect(entryLine).toBeDefined();
      expect(entryLine).toContain('[INFO]');
      expect(entryLine).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3} \[INFO\] specific message here$/);
    });
  });

  test.describe('Browser Source Prefix', () => {

    test('should not include [BROWSER] prefix for test source', async ({ smartLog }) => {
      smartLog.log('test source entry');
      const content = await getAttachmentContent(smartLog);

      const lines = content.split('\n');
      const entryLine = lines.find(l => l.includes('test source entry'));
      expect(entryLine).toBeDefined();
      expect(entryLine).not.toContain('[BROWSER]');
    });
  });

  test.describe('Group Indentation', () => {

    test('should indent entries inside a group', async ({ smartLog }) => {
      smartLog.log('level 0');
      smartLog.group('Group');
      smartLog.log('level 1');
      smartLog.groupEnd();

      const content = await getAttachmentContent(smartLog);
      const lines = content.split('\n');

      const level0Line = lines.find(l => l.includes('level 0'));
      const level1Line = lines.find(l => l.includes('level 1'));
      expect(level0Line).toBeDefined();
      expect(level1Line).toBeDefined();

      // Format is "[LOG] {indent}{text}" — 1 space after ] + 2-space indent = 3 spaces total
      expect(level1Line).toMatch(/\[LOG\] {3}level 1/);
      // level 0 has no indent — just 1 space after ]
      expect(level0Line).toMatch(/\[LOG\] level 0/);
    });

    test('should indent nested groups correctly', async ({ smartLog }) => {
      smartLog.group('Outer');
      smartLog.group('Inner');
      smartLog.log('deep');
      smartLog.groupEnd();
      smartLog.groupEnd();

      const content = await getAttachmentContent(smartLog);
      const lines = content.split('\n');

      const deepLine = lines.find(l => l.includes('deep'));
      expect(deepLine).toBeDefined();
      // Format is "[LOG] {indent}{text}" — 1 space after ] + 4-space indent = 5 spaces total
      expect(deepLine).toMatch(/\[LOG\] {5}deep/);
    });
  });

  test.describe('Table Data Formatting', () => {

    test('should format array table data in attachment', async ({ smartLog }) => {
      smartLog.table([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ]);

      const content = await getAttachmentContent(smartLog);

      expect(content).toContain('name | age');
      expect(content).toContain('--- | ---');
      expect(content).toContain('Alice | 30');
      expect(content).toContain('Bob | 25');
    });

    test('should format table with columns filter', async ({ smartLog }) => {
      smartLog.table(
        [{ name: 'Alice', age: 30, city: 'NYC' }],
        ['name', 'city']
      );

      const content = await getAttachmentContent(smartLog);

      expect(content).toContain('name | city');
      expect(content).toContain('Alice | NYC');
      // Should NOT include unfiltered column header
      expect(content).not.toMatch(/\bage\b.*\|/);
    });

    test('should format single object table as key-value pairs', async ({ smartLog }) => {
      smartLog.table({ key1: 'value1', key2: 'value2' });

      const content = await getAttachmentContent(smartLog);

      expect(content).toContain('Key | Value');
      expect(content).toContain('--- | ---');
      expect(content).toContain('key1 | value1');
      expect(content).toContain('key2 | value2');
    });

    test('should format null table as empty', async ({ smartLog }) => {
      smartLog.table(null);

      const content = await getAttachmentContent(smartLog);

      expect(content).toContain('(empty table)');
    });

    test('should format empty array table as empty', async ({ smartLog }) => {
      smartLog.table([]);

      const content = await getAttachmentContent(smartLog);

      expect(content).toContain('(empty table)');
    });

    test('should format empty object table as empty', async ({ smartLog }) => {
      smartLog.table({});

      const content = await getAttachmentContent(smartLog);

      expect(content).toContain('(empty table)');
    });
  });

  test.describe('Dir Formatting', () => {

    test('should format dir entries with safeStringify', async ({ smartLog }) => {
      smartLog.dir({ name: 'test', nested: { value: 42 } });

      const content = await getAttachmentContent(smartLog);

      // safeStringify uses indent=2 by default
      expect(content).toContain('"name": "test"');
      expect(content).toContain('"value": 42');
    });

    test('should handle circular references in dir', async ({ smartLog }) => {
      const circular: any = { name: 'circular' };
      circular.self = circular;

      smartLog.dir(circular);

      const content = await getAttachmentContent(smartLog);

      expect(content).toContain('[Circular]');
      expect(content).toContain('"name": "circular"');
    });
  });

  test.describe('Regular Args Formatting', () => {

    test('should format string args', async ({ smartLog }) => {
      smartLog.log('hello', 'world');

      const content = await getAttachmentContent(smartLog);

      const lines = content.split('\n');
      const entryLine = lines.find(l => l.includes('hello'));
      expect(entryLine).toContain('hello world');
    });

    test('should format null and undefined', async ({ smartLog }) => {
      smartLog.log(null, undefined);

      const content = await getAttachmentContent(smartLog);

      expect(content).toContain('null undefined');
    });

    test('should format numbers and booleans', async ({ smartLog }) => {
      smartLog.log(42, true, false);

      const content = await getAttachmentContent(smartLog);

      expect(content).toContain('42 true false');
    });

    test('should format Error objects', async ({ smartLog }) => {
      smartLog.log(new Error('test error'));

      const content = await getAttachmentContent(smartLog);

      expect(content).toContain('Error: test error');
    });

    test('should format Symbol values', async ({ smartLog }) => {
      smartLog.log(Symbol('mySymbol'));

      const content = await getAttachmentContent(smartLog);

      expect(content).toContain('Symbol(mySymbol)');
    });

    test('should format objects as JSON', async ({ smartLog }) => {
      smartLog.log({ key: 'value' });

      const content = await getAttachmentContent(smartLog);

      // formatArg -> safeStringify for objects
      expect(content).toContain('"key"');
      expect(content).toContain('"value"');
    });
  });

  test.describe('Mixed Entry Types', () => {

    test('should format a mix of regular, table, and dir entries', async ({ smartLog }) => {
      smartLog.info('Start of test');
      smartLog.table([{ step: 1, status: 'ok' }]);
      smartLog.dir({ detail: 'some object' });
      smartLog.warn('Something fishy');
      smartLog.error('Failure detected');

      const content = await getAttachmentContent(smartLog);

      // Verify all entry types are present
      expect(content).toContain('[INFO]');
      expect(content).toContain('Start of test');
      expect(content).toContain('step | status');
      expect(content).toContain('1 | ok');
      expect(content).toContain('"detail": "some object"');
      expect(content).toContain('[WARN]');
      expect(content).toContain('Something fishy');
      expect(content).toContain('[ERROR]');
      expect(content).toContain('Failure detected');
    });

    test('should format grouped table and dir entries', async ({ smartLog }) => {
      smartLog.group('Data');
      smartLog.table([{ id: 1 }]);
      smartLog.dir({ key: 'val' });
      smartLog.groupEnd();

      const content = await getAttachmentContent(smartLog);
      const lines = content.split('\n');

      // The table header line should be indented (groupLevel 1 = 2 spaces)
      const idLine = lines.find(l => l.includes('id'));
      expect(idLine).toBeDefined();

      // Dir entry should also be indented
      const dirLine = lines.find(l => l.includes('"key"'));
      expect(dirLine).toBeDefined();
    });
  });

  test.describe('Multiple Flushes', () => {

    test('should create separate attachments per flush', async ({ smartLog }) => {
      smartLog.log('batch 1');
      await smartLog.flush();

      smartLog.log('batch 2');
      await smartLog.flush();

      const attachments = test.info().attachments.filter((a: any) => a.name === 'smart-log');
      expect(attachments).toHaveLength(2);

      const content1 = attachments[0].body!.toString('utf-8');
      const content2 = attachments[1].body!.toString('utf-8');

      expect(content1).toContain('batch 1');
      expect(content1).not.toContain('batch 2');
      expect(content2).toContain('batch 2');
      expect(content2).not.toContain('batch 1');
    });
  });

  test.describe('Empty Buffer', () => {

    test('should not create attachment when buffer is empty', async ({ smartLog }) => {
      await smartLog.flush();

      const attachments = test.info().attachments.filter((a: any) => a.name === 'smart-log');
      expect(attachments).toHaveLength(0);
    });
  });
});
