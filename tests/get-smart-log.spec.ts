import { test, expect, getSmartLog, smartLog } from '../src';

// Helper function using getSmartLog()
function logFromHelper(message: string) {
  const log = getSmartLog();
  log.info(message);
}

// Page Object Model using smartLog proxy
class ExamplePage {
  log(message: string) {
    smartLog.info(message);
  }
}

test.describe('SmartLog - Global Accessors', () => {

test.describe('getSmartLog Function', () => {

  test('should return current fixture inside test', async ({ smartLog: fixture }) => {
    const global = getSmartLog();
    
    global.log('from global');
    fixture.log('from fixture');
    
    const buffer = fixture.getBuffer();
    expect(buffer).toHaveLength(2);
    expect(buffer[0].args).toEqual(['from global']);
    expect(buffer[1].args).toEqual(['from fixture']);
  });

  test('should work from helper function', async ({ smartLog: fixture }) => {
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

test.describe('smartLog Proxy', () => {

  test('should log directly without function call', async ({ smartLog: fixture }) => {
    smartLog.info('direct access');
    
    const buffer = fixture.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('info');
    expect(buffer[0].args).toEqual(['direct access']);
  });

  test('should work from page object model', async ({ smartLog: fixture }) => {
    const page = new ExamplePage();
    page.log('navigating to login');
    
    const buffer = fixture.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('info');
    expect(buffer[0].args).toEqual(['navigating to login']);
  });

  test('should have all methods available', async ({ smartLog: _fixture }) => {
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'group', 'groupEnd', 
                    'table', 'dir', 'time', 'timeEnd', 'timeLog', 'assert', 
                    'count', 'countReset', 'trace', 'clear', 'getBuffer', 'flush'];
    
    methods.forEach(method => {
      expect(typeof smartLog[method as keyof typeof smartLog]).toBe('function');
    });
  });

  test('should support groups and timers', async ({ smartLog: fixture }) => {
    smartLog.group('Setup');
    smartLog.info('inside group');
    smartLog.groupEnd();
    
    const buffer = fixture.getBuffer();
    expect(buffer).toHaveLength(2);
    expect(buffer[1].groupLevel).toBe(1);
  });

  test('each test gets isolated logger', async ({ smartLog: fixture }) => {
    expect(fixture.getBuffer()).toHaveLength(0);
    
    smartLog.log('isolated');
    expect(fixture.getBuffer()).toHaveLength(1);
  });
});

test.describe('Interoperability', () => {

  test('proxy and function share same buffer', async ({ smartLog: fixture }) => {
    smartLog.info('from proxy');
    getSmartLog().warn('from function');
    fixture.error('from fixture');
    
    const buffer = fixture.getBuffer();
    expect(buffer).toHaveLength(3);
    expect(buffer.map(e => e.level)).toEqual(['info', 'warn', 'error']);
  });

  test('methods should maintain proper binding', async ({ smartLog: fixture }) => {
    const logMethod = smartLog.log;
    const getBufferMethod = smartLog.getBuffer;
    
    logMethod('detached method call');
    const buffer = getBufferMethod();
    
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args[0]).toBe('detached method call');
  });
});

});
