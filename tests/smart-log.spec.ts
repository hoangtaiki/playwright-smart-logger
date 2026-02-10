import { test, expect } from '../src/smart-log-fixture';

test.describe('SmartLog - Core Logging Methods', () => {

  test('should buffer log() with variadic args', async ({ smartLog }) => {
    smartLog.log('hello', { a: 1 }, 123);

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('log');
    expect(buffer[0].args).toEqual(['hello', { a: 1 }, 123]);
    expect(buffer[0].source).toBe('test');
  });

  test('should buffer debug() calls', async ({ smartLog }) => {
    smartLog.debug('debug message');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('debug');
    expect(buffer[0].args).toEqual(['debug message']);
  });

  test('should buffer info() calls', async ({ smartLog }) => {
    smartLog.info('info message');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('info');
    expect(buffer[0].args).toEqual(['info message']);
  });

  test('should buffer warn() calls', async ({ smartLog }) => {
    smartLog.warn('warning message');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('warn');
    expect(buffer[0].args).toEqual(['warning message']);
  });

  test('should buffer error() calls', async ({ smartLog }) => {
    smartLog.error('error message');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('error');
    expect(buffer[0].args).toEqual(['error message']);
  });

  test('should handle empty args', async ({ smartLog }) => {
    smartLog.log();

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args).toEqual([]);
  });

  test('should handle single string arg', async ({ smartLog }) => {
    smartLog.log('hello');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args).toEqual(['hello']);
  });

  test('should handle mixed arg types', async ({ smartLog }) => {
    smartLog.log('str', 42, true, null, undefined, { k: 'v' }, [1, 2]);

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args).toEqual(['str', 42, true, null, undefined, { k: 'v' }, [1, 2]]);
  });

  test('should set source to test for all entries', async ({ smartLog }) => {
    smartLog.log('a');
    smartLog.info('b');
    smartLog.warn('c');
    smartLog.error('d');
    smartLog.debug('e');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(5);
    for (const entry of buffer) {
      expect(entry.source).toBe('test');
    }
  });

  test('should set timestamp close to Date.now()', async ({ smartLog }) => {
    const before = Date.now();
    smartLog.log('timed');
    const after = Date.now();

    const buffer = smartLog.getBuffer();
    expect(buffer[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(buffer[0].timestamp).toBeLessThanOrEqual(after);
  });

  test('should set groupLevel to 0 by default', async ({ smartLog }) => {
    smartLog.log('a');
    smartLog.info('b');
    smartLog.warn('c');
    smartLog.error('d');
    smartLog.debug('e');

    const buffer = smartLog.getBuffer();
    for (const entry of buffer) {
      expect(entry.groupLevel).toBe(0);
    }
  });

  test('should capture multiple sequential calls', async ({ smartLog }) => {
    smartLog.log('first');
    smartLog.info('second');
    smartLog.warn('third');
    smartLog.error('fourth');
    smartLog.debug('fifth');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(5);
    expect(buffer.map(e => e.level)).toEqual(['log', 'info', 'warn', 'error', 'debug']);
  });
});

test.describe('SmartLog - Group Methods', () => {

  test('should track group depth', async ({ smartLog }) => {
    smartLog.log('before group');
    smartLog.group('Group 1');
    smartLog.log('inside group');
    smartLog.groupEnd();
    smartLog.log('after group');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(4); // log, group header, log inside, log after
    expect(buffer[0].groupLevel).toBe(0); // before group
    expect(buffer[1].groupLevel).toBe(0); // group header itself
    expect(buffer[2].groupLevel).toBe(1); // inside group
    expect(buffer[3].groupLevel).toBe(0); // after group
  });

  test('should handle nested groups', async ({ smartLog }) => {
    smartLog.group('Outer');
    smartLog.group('Inner');
    smartLog.log('deep inside');
    smartLog.groupEnd();
    smartLog.log('back in outer');
    smartLog.groupEnd();
    smartLog.log('outside');

    const buffer = smartLog.getBuffer();
    expect(buffer[0].groupLevel).toBe(0); // Outer header
    expect(buffer[1].groupLevel).toBe(1); // Inner header
    expect(buffer[2].groupLevel).toBe(2); // deep inside
    expect(buffer[3].groupLevel).toBe(1); // back in outer
    expect(buffer[4].groupLevel).toBe(0); // outside
  });

  test('should not go negative on extra groupEnd', async ({ smartLog }) => {
    smartLog.groupEnd(); // extra groupEnd
    smartLog.groupEnd(); // another extra
    smartLog.log('still at 0');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].groupLevel).toBe(0);
  });

  test('should store group label in args', async ({ smartLog }) => {
    smartLog.group('Phase 1');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args).toEqual(['Phase 1']);
  });

  test('groupEnd should not create buffer entry', async ({ smartLog }) => {
    smartLog.group('Test');
    const lengthAfterGroup = smartLog.getBuffer().length;
    smartLog.groupEnd();
    const lengthAfterGroupEnd = smartLog.getBuffer().length;

    expect(lengthAfterGroupEnd).toBe(lengthAfterGroup);
  });

  test('should handle group with no label', async ({ smartLog }) => {
    smartLog.group();
    smartLog.log('inside');
    smartLog.groupEnd();

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(2);
    expect(buffer[0].args).toEqual(['']);
    expect(buffer[1].groupLevel).toBe(1);
  });
});

test.describe('SmartLog - Table Method', () => {

  test('should buffer table data', async ({ smartLog }) => {
    const data = [{ a: 1 }, { a: 2 }];
    smartLog.table(data);

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('log');
    expect(buffer[0].args[0]).toEqual(data);
  });

  test('should handle empty array', async ({ smartLog }) => {
    smartLog.table([]);

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args[0]).toEqual([]);
  });

  test('should handle non-array data', async ({ smartLog }) => {
    smartLog.table({ key: 'value' });

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args[0]).toEqual({ key: 'value' });
  });

  test('should accept columns parameter', async ({ smartLog }) => {
    const data = [{ name: 'Alice', age: 30, city: 'NYC' }];
    smartLog.table(data, ['name', 'age']);

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args[1]).toEqual({ __tableColumns: ['name', 'age'] });
  });
});

test.describe('SmartLog - Dir Method', () => {

  test('should buffer object', async ({ smartLog }) => {
    const obj = { a: 1, b: { c: 2 } };
    smartLog.dir(obj);

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('log');
    expect(buffer[0].args[0]).toEqual(obj);
  });

  test('should handle circular references without crash', async ({ smartLog }) => {
    const circular: any = { name: 'test' };
    circular.self = circular;

    expect(() => smartLog.dir(circular)).not.toThrow();
    expect(smartLog.getBuffer()).toHaveLength(1);
  });

  test('should handle null and undefined', async ({ smartLog }) => {
    smartLog.dir(null);
    smartLog.dir(undefined);

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(2);
    expect(buffer[0].args[0]).toBeNull();
    expect(buffer[1].args[0]).toBeUndefined();
  });

  test('should handle primitives', async ({ smartLog }) => {
    smartLog.dir('string');
    smartLog.dir(42);
    smartLog.dir(true);

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(3);
    expect(buffer[0].args[0]).toBe('string');
    expect(buffer[1].args[0]).toBe(42);
    expect(buffer[2].args[0]).toBe(true);
  });
});

test.describe('SmartLog - Timer Methods', () => {

  test('time/timeEnd should measure duration', async ({ smartLog }) => {
    smartLog.time('test-timer');
    await new Promise(resolve => setTimeout(resolve, 50));
    smartLog.timeEnd('test-timer');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('log');
    expect(buffer[0].args[0]).toMatch(/^test-timer: \d+ms$/);

    const duration = parseInt(buffer[0].args[0].match(/(\d+)ms/)[1]);
    expect(duration).toBeGreaterThanOrEqual(40); // allow some tolerance
  });

  test('should use default label when none provided', async ({ smartLog }) => {
    smartLog.time();
    smartLog.timeEnd();

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args[0]).toContain('default:');
  });

  test('timeEnd without time should warn', async ({ smartLog }) => {
    smartLog.timeEnd('nonexistent');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('warn');
    expect(buffer[0].args[0]).toContain('does not exist');
  });

  test('time on existing timer should warn', async ({ smartLog }) => {
    smartLog.time('dup');
    smartLog.time('dup');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('warn');
    expect(buffer[0].args[0]).toContain('already exists');
  });

  test('timeLog should report elapsed without stopping', async ({ smartLog }) => {
    smartLog.time('running');
    await new Promise(resolve => setTimeout(resolve, 30));
    smartLog.timeLog('running', 'checkpoint');
    await new Promise(resolve => setTimeout(resolve, 30));
    smartLog.timeEnd('running');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(2); // timeLog entry + timeEnd entry

    // timeLog entry
    expect(buffer[0].args[0]).toMatch(/^running: \d+ms$/);
    expect(buffer[0].args[1]).toBe('checkpoint');

    // timeEnd entry (should have longer duration)
    expect(buffer[1].args[0]).toMatch(/^running: \d+ms$/);
  });

  test('timeLog with extra args', async ({ smartLog }) => {
    smartLog.time('t');
    smartLog.timeLog('t', 'a', 'b', 123);

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args[0]).toMatch(/^t: \d+ms$/);
    expect(buffer[0].args[1]).toBe('a');
    expect(buffer[0].args[2]).toBe('b');
    expect(buffer[0].args[3]).toBe(123);
  });

  test('timeLog without existing timer should warn', async ({ smartLog }) => {
    smartLog.timeLog('nonexistent');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('warn');
    expect(buffer[0].args[0]).toContain('does not exist');
  });

  test('multiple independent timers', async ({ smartLog }) => {
    smartLog.time('timer-a');
    smartLog.time('timer-b');
    await new Promise(resolve => setTimeout(resolve, 20));
    smartLog.timeEnd('timer-a');
    smartLog.timeEnd('timer-b');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(2);
    expect(buffer[0].args[0]).toContain('timer-a:');
    expect(buffer[1].args[0]).toContain('timer-b:');
  });
});

test.describe('SmartLog - Assert Method', () => {

  test('should not log when condition is true', async ({ smartLog }) => {
    smartLog.assert(true, 'should not appear');

    expect(smartLog.getBuffer()).toHaveLength(0);
  });

  test('should log error when condition is false', async ({ smartLog }) => {
    smartLog.assert(false, 'something went wrong');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('error');
    expect(buffer[0].args).toEqual(['Assertion failed:', 'something went wrong']);
  });

  test('should handle assert(false) with no message', async ({ smartLog }) => {
    smartLog.assert(false);

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args).toEqual(['Assertion failed']);
  });

  test('should treat falsy values as false', async ({ smartLog }) => {
    smartLog.assert(0 as any, 'zero');
    smartLog.assert(null as any, 'null');
    smartLog.assert(undefined, 'undefined');
    smartLog.assert('' as any, 'empty string');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(4);
    for (const entry of buffer) {
      expect(entry.level).toBe('error');
      expect(entry.args[0]).toBe('Assertion failed:');
    }
  });

  test('should treat truthy values as true', async ({ smartLog }) => {
    smartLog.assert(1 as any, 'one');
    smartLog.assert('text' as any, 'text');
    smartLog.assert({} as any, 'object');
    smartLog.assert([] as any, 'array');

    expect(smartLog.getBuffer()).toHaveLength(0);
  });

  test('should pass extra args', async ({ smartLog }) => {
    smartLog.assert(false, 'a', 'b', 123);

    const buffer = smartLog.getBuffer();
    expect(buffer[0].args).toEqual(['Assertion failed:', 'a', 'b', 123]);
  });
});

test.describe('SmartLog - Count Methods', () => {

  test('should count with label', async ({ smartLog }) => {
    smartLog.count('clicks');
    smartLog.count('clicks');
    smartLog.count('clicks');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(3);
    expect(buffer[0].args[0]).toBe('clicks: 1');
    expect(buffer[1].args[0]).toBe('clicks: 2');
    expect(buffer[2].args[0]).toBe('clicks: 3');
  });

  test('should use default label', async ({ smartLog }) => {
    smartLog.count();

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args[0]).toBe('default: 1');
  });

  test('should track separate labels independently', async ({ smartLog }) => {
    smartLog.count('a');
    smartLog.count('b');
    smartLog.count('a');

    const buffer = smartLog.getBuffer();
    expect(buffer[0].args[0]).toBe('a: 1');
    expect(buffer[1].args[0]).toBe('b: 1');
    expect(buffer[2].args[0]).toBe('a: 2');
  });

  test('countReset should reset counter', async ({ smartLog }) => {
    smartLog.count('items');
    smartLog.count('items');
    smartLog.countReset('items');
    smartLog.count('items');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(3); // 2 counts + 1 count after reset (countReset has no entry)
    expect(buffer[2].args[0]).toBe('items: 1'); // reset back to 1
  });

  test('countReset on nonexistent label should warn', async ({ smartLog }) => {
    smartLog.countReset('nonexistent');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('warn');
    expect(buffer[0].args[0]).toContain('does not exist');
  });
});

test.describe('SmartLog - Trace Method', () => {

  test('should create log entry with Trace prefix', async ({ smartLog }) => {
    smartLog.trace('my message');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args[0]).toBe('Trace:');
    expect(buffer[0].args[1]).toBe('my message');
  });

  test('should include stack trace', async ({ smartLog }) => {
    smartLog.trace();

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    // Last arg should contain stack trace with 'at' keyword
    const lastArg = buffer[0].args[buffer[0].args.length - 1];
    expect(lastArg).toContain('at');
  });

  test('should pass extra args', async ({ smartLog }) => {
    smartLog.trace('a', 'b');

    const buffer = smartLog.getBuffer();
    expect(buffer[0].args[0]).toBe('Trace:');
    expect(buffer[0].args[1]).toBe('a');
    expect(buffer[0].args[2]).toBe('b');
  });
});

test.describe('SmartLog - Clear Method', () => {

  test('should empty the buffer', async ({ smartLog }) => {
    smartLog.log('a');
    smartLog.log('b');
    expect(smartLog.getBuffer()).toHaveLength(2);

    smartLog.clear();
    expect(smartLog.getBuffer()).toHaveLength(0);
  });

  test('should reset group depth', async ({ smartLog }) => {
    smartLog.group('g1');
    smartLog.group('g2');
    smartLog.clear();

    smartLog.log('after clear');
    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].groupLevel).toBe(0);
  });

  test('should not reset timers', async ({ smartLog }) => {
    smartLog.time('persistent');
    smartLog.clear();
    await new Promise(resolve => setTimeout(resolve, 10));
    smartLog.timeEnd('persistent');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].level).toBe('log'); // not warn (timer exists)
    expect(buffer[0].args[0]).toContain('persistent:');
  });

  test('should not reset counters', async ({ smartLog }) => {
    smartLog.count('items');
    smartLog.clear();
    smartLog.count('items');

    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args[0]).toBe('items: 2'); // counter preserved
  });
});

test.describe('SmartLog - Buffer Management', () => {

  test('should respect maxBufferSize', async ({ smartLog }) => {
    // Default maxBufferSize is 1000
    for (let i = 0; i < 1100; i++) {
      smartLog.log(`entry ${i}`);
    }

    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBeLessThanOrEqual(1000);
    // Should keep the most recent entries
    expect(buffer[buffer.length - 1].args[0]).toBe('entry 1099');
  });

  test('should return copy from getBuffer', async ({ smartLog }) => {
    smartLog.log('original');

    const buffer1 = smartLog.getBuffer();
    buffer1.push({ level: 'log', args: ['injected'], timestamp: 0, source: 'test', groupLevel: 0 });

    const buffer2 = smartLog.getBuffer();
    expect(buffer2).toHaveLength(1); // not affected by mutation
  });

  test('flush should clear buffer', async ({ smartLog }) => {
    smartLog.log('will be flushed');
    smartLog.info('also flushed');
    expect(smartLog.getBuffer()).toHaveLength(2);

    await smartLog.flush();
    expect(smartLog.getBuffer()).toHaveLength(0);
  });

  test('flush on empty buffer should not error', async ({ smartLog }) => {
    await expect(smartLog.flush()).resolves.toBeUndefined();
    expect(smartLog.getBuffer()).toHaveLength(0);
  });
});
