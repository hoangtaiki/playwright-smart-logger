import { test, expect, getSmartLog, smartLog } from '../src';

// --- Helper using getSmartLog() ---
function logFromHelper(message: string) {
  const log = getSmartLog();
  log.info(message);
}

// --- Page Object Model using smartLog proxy ---
class ExamplePage {
  log(message: string) {
    smartLog.info(message);
  }
}

test.describe('getSmartLog - Function Accessor', () => {

  test('should return the current fixture inside a test', async ({ smartLog: fixture }) => {
    const global = getSmartLog();

    global.log('from global');
    fixture.log('from fixture');

    const buffer = fixture.getBuffer();
    expect(buffer).toHaveLength(2);
    expect(buffer[0].args).toEqual(['from global']);
    expect(buffer[1].args).toEqual(['from fixture']);
  });

  test('should work from a helper function', async ({ smartLog: fixture }) => {
    logFromHelper('hello from helper');

    const buffer = fixture.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('info');
    expect(buffer[0].args).toEqual(['hello from helper']);
  });

  test('should share buffer with fixture', async ({ smartLog: fixture }) => {
    fixture.info('from fixture');
    getSmartLog().warn('from getSmartLog');
    fixture.error('from fixture again');

    const buffer = fixture.getBuffer();
    expect(buffer).toHaveLength(3);
    expect(buffer.map(e => e.level)).toEqual(['info', 'warn', 'error']);
  });
});

test.describe('smartLog - Proxy Accessor', () => {

  test('should log directly without function call', async ({ smartLog: fixture }) => {
    smartLog.info('direct access');

    const buffer = fixture.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('info');
    expect(buffer[0].args).toEqual(['direct access']);
  });

  test('should work from a page object model', async ({ smartLog: fixture }) => {
    const page = new ExamplePage();
    page.log('navigating to login');

    const buffer = fixture.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('info');
    expect(buffer[0].args).toEqual(['navigating to login']);
  });

  test('should share buffer with fixture', async ({ smartLog: fixture }) => {
    fixture.log('from fixture');
    smartLog.warn('from proxy');
    fixture.error('from fixture again');

    const buffer = fixture.getBuffer();
    expect(buffer).toHaveLength(3);
    expect(buffer.map(e => e.level)).toEqual(['log', 'warn', 'error']);
  });

  test('should have all fixture methods available', async ({ smartLog: _fixture }) => {
    expect(typeof smartLog.log).toBe('function');
    expect(typeof smartLog.debug).toBe('function');
    expect(typeof smartLog.info).toBe('function');
    expect(typeof smartLog.warn).toBe('function');
    expect(typeof smartLog.error).toBe('function');
    expect(typeof smartLog.group).toBe('function');
    expect(typeof smartLog.groupEnd).toBe('function');
    expect(typeof smartLog.table).toBe('function');
    expect(typeof smartLog.dir).toBe('function');
    expect(typeof smartLog.time).toBe('function');
    expect(typeof smartLog.timeEnd).toBe('function');
    expect(typeof smartLog.timeLog).toBe('function');
    expect(typeof smartLog.assert).toBe('function');
    expect(typeof smartLog.count).toBe('function');
    expect(typeof smartLog.countReset).toBe('function');
    expect(typeof smartLog.trace).toBe('function');
    expect(typeof smartLog.clear).toBe('function');
    expect(typeof smartLog.getBuffer).toBe('function');
    expect(typeof smartLog.flush).toBe('function');
  });

  test('should support groups and timers', async ({ smartLog: fixture }) => {
    smartLog.group('Setup');
    smartLog.info('inside group');
    smartLog.groupEnd();

    const buffer = fixture.getBuffer();
    expect(buffer).toHaveLength(2);
    expect(buffer[1].groupLevel).toBe(1);
  });

  test('each test should get isolated logger', async ({ smartLog: fixture }) => {
    // Buffer is empty — not polluted from previous tests
    expect(fixture.getBuffer()).toHaveLength(0);

    smartLog.log('isolated');
    expect(fixture.getBuffer()).toHaveLength(1);
  });
});

test.describe('smartLog + getSmartLog - Interop', () => {

  test('proxy and function should write to same buffer', async ({ smartLog: fixture }) => {
    smartLog.info('from proxy');
    getSmartLog().warn('from function');
    fixture.error('from fixture');

    const buffer = fixture.getBuffer();
    expect(buffer).toHaveLength(3);
    expect(buffer.map(e => e.level)).toEqual(['info', 'warn', 'error']);
  });
});
