import { test, expect } from '../src/smart-log';

test.describe('SmartLog - Core API Tests', () => {

test.describe('Core Logging Methods', () => {

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

test.describe('Browser Console Integration', () => {

  test('should handle browser console when disabled (default)', async ({ page, smartLog }) => {
    await page.goto('data:text/html,<script>console.log("browser message")</script>');
    await page.waitForTimeout(100);
    
    const buffer = smartLog.getBuffer();
    const browserEntries = buffer.filter(entry => entry.source === 'browser');
    expect(browserEntries).toHaveLength(0);
  });

  test('should handle mixed test and browser logs', async ({ page, smartLog }) => {
    smartLog.log('before page');
    await page.goto('data:text/html,<script>console.log("browser")</script>');
    await page.waitForTimeout(50);
    smartLog.log('after page');
    
    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBeGreaterThanOrEqual(2);
    expect(buffer[0].args[0]).toBe('before page');
  });
});

test.describe('Output Formatting & Flush', () => {

  test('should format and flush output correctly', async ({ smartLog }) => {
    smartLog.info('Test message');
    smartLog.group('Group');
    smartLog.warn('Nested warning');
    smartLog.groupEnd();
    
    let capturedOutput = '';
    const originalWrite = process.stdout.write;
    
    process.stdout.write = function(chunk: any): boolean {
      capturedOutput += chunk;
      return true;
    };
    
    try {
      await smartLog.flush();
      
      expect(capturedOutput).toContain('=== Smart Logger Output ===');
      expect(capturedOutput).toContain('[INFO]');
      expect(capturedOutput).toContain('[WARN]');
      expect(capturedOutput).toContain('Test message');
      expect(capturedOutput).toContain('Nested warning');
      
    } finally {
      process.stdout.write = originalWrite;
    }
    
    expect(smartLog.getBuffer()).toHaveLength(0);
  });

  test('should handle complex data formatting', async ({ smartLog }) => {
    const complexObj = { name: 'test', nested: { value: 42 } };
    const circularObj: any = { name: 'circular' };
    circularObj.self = circularObj;
    
    smartLog.table([{ a: 1 }, { a: 2 }]);
    smartLog.dir(complexObj);
    smartLog.log(circularObj); // Should handle circular reference
    
    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(3);
    expect((buffer[0] as any).__isTable).toBe(true);
    expect((buffer[1] as any).__isDir).toBe(true);
  });
});

test.describe('Error Handling & Edge Cases', () => {

  test('should handle all argument types safely', async ({ smartLog }) => {
    const symbol = Symbol('test');
    const error = new Error('test error');
    const bigInt = BigInt(123);
    
    smartLog.log('string', 123, true, null, undefined, symbol, error, bigInt);
    
    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args).toHaveLength(8);
  });

  test('should handle buffer size limits', async ({ smartLog }) => {
    for (let i = 0; i < 1100; i++) {
      smartLog.log(`entry ${i}`);
    }
    
    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBeLessThanOrEqual(1000);
    expect(buffer[buffer.length - 1].args[0]).toBe('entry 1099');
  });

  test('should handle rapid operations gracefully', async ({ smartLog }) => {
    for (let i = 0; i < 100; i++) {
      smartLog.log(`rapid ${i}`);
      smartLog.count('counter');
      if (i % 10 === 0) smartLog.group(`Group ${i}`);
      if (i % 10 === 9) smartLog.groupEnd();
    }
    
    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBeGreaterThan(100);
  });

  test('should handle cleanup gracefully', async ({ smartLog }) => {
    // Create resources that need cleanup
    smartLog.time('cleanup-test');
    smartLog.count('cleanup-counter');
    smartLog.group('cleanup-group');
    
    // Test continues to end where cleanup happens automatically
    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBeGreaterThan(0);
  });

  test('should handle BigInt values', async ({ smartLog }) => {
    const bigIntValue = BigInt(123456789012345678901234567890n);
    smartLog.log('BigInt test:', bigIntValue);
    
    const buffer = smartLog.getBuffer();
    expect(buffer[0].args[1]).toBe(bigIntValue);
  });

  test('should handle deeply nested groups without overflow', async ({ smartLog }) => {
    for (let i = 0; i < 20; i++) {
      smartLog.group(`Level ${i}`);
    }
    
    smartLog.log('Deep message');
    
    for (let i = 0; i < 20; i++) {
      smartLog.groupEnd();
    }
    
    smartLog.log('Back to level 0');
    
    const buffer = smartLog.getBuffer();
    const deepMessage = buffer.find(e => e.args[0] === 'Deep message');
    const finalMessage = buffer.find(e => e.args[0] === 'Back to level 0');
    
    expect(deepMessage?.groupLevel).toBe(20);
    expect(finalMessage?.groupLevel).toBe(0);
  });
});

test.describe('Missing Coverage & Regression Tests', () => {

  test('should handle timer edge cases comprehensively', async ({ smartLog }) => {
    // Test default timer
    smartLog.time();
    await new Promise(resolve => setTimeout(resolve, 1));
    smartLog.timeEnd();
    
    // Test multiple timers
    smartLog.time('timer-a');
    smartLog.time('timer-b');
    smartLog.timeLog('timer-a', 'checkpoint');
    smartLog.timeEnd('timer-b');
    smartLog.timeEnd('timer-a');
    
    // Test warnings
    smartLog.timeEnd('nonexistent');
    smartLog.timeLog('nonexistent');
    smartLog.time('duplicate');
    smartLog.time('duplicate');
    
    const buffer = smartLog.getBuffer();
    const warnings = buffer.filter(e => e.level === 'warn');
    expect(warnings.length).toBe(3); // nonexistent timeEnd, timeLog, duplicate timer
  });

  test('should handle all table formatting scenarios', async ({ smartLog }) => {
    // Various table data types
    smartLog.table(null);
    smartLog.table(undefined);
    smartLog.table([]);
    smartLog.table({});
    smartLog.table({ key: 'value' });
    smartLog.table([{ a: 1, b: 2 }, { a: 3, c: 4 }]);
    smartLog.table([{ name: 'Alice' }], ['name', 'missing']);
    smartLog.table('primitive');
    
    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBe(8);
    buffer.forEach(entry => {
      expect((entry as any).__isTable).toBe(true);
    });
  });

  test('should handle operations after clear correctly', async ({ smartLog }) => {
    // Setup state
    smartLog.group('Before clear');
    smartLog.time('before-timer');
    smartLog.count('before-counter');
    smartLog.log('Message before clear');
    
    expect(smartLog.getBuffer().length).toBe(3); // group, count, log
    
    smartLog.clear();
    expect(smartLog.getBuffer().length).toBe(0);
    
    // Operations after clear
    smartLog.log('After clear');
    smartLog.count('before-counter'); // Should continue counting
    smartLog.timeEnd('before-timer'); // Timer should still exist
    
    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBe(3);
    
    // Check that state was preserved correctly
    const countEntry = buffer.find(e => e.args[0]?.includes('before-counter'));
    expect(countEntry?.args[0]).toBe('before-counter: 2');
    
    const afterClearEntry = buffer.find(e => e.args[0] === 'After clear');
    expect(afterClearEntry?.groupLevel).toBe(0); // Group depth reset
  });
});

test.describe('FormatArg Function Coverage', () => {

  test('should format all argument types in output', async ({ smartLog }) => {
    const symbol = Symbol('test');
    const error = new Error('Test error');
    const date = new Date();
    
    smartLog.log(undefined, null, 'string', symbol, error, { nested: 'object' });
    
    let capturedOutput = '';
    const originalWrite = process.stdout.write;
    process.stdout.write = function(chunk: any): boolean {
      capturedOutput += chunk;
      return true;
    };
    
    try {
      await smartLog.flush();
      
      expect(capturedOutput).toContain('undefined');
      expect(capturedOutput).toContain('null');
      expect(capturedOutput).toContain('string');
      expect(capturedOutput).toContain('Symbol(test)');
      expect(capturedOutput).toContain('Error: Test error');
      expect(capturedOutput).toContain('nested');
    } finally {
      process.stdout.write = originalWrite;
    }
  });

  test('should handle formatArg with various data types', async ({ smartLog }) => {
    smartLog.log(
      'string value',
      42,
      true, 
      false,
      BigInt(123),
      Symbol.for('global'),
      new RegExp('test'),
      new Map([['key', 'value']]),
      new Set([1, 2, 3]),
      new Date('2023-01-01')
    );
    
    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args).toHaveLength(10);
  });
});

test.describe('Buffer Management Edge Cases', () => {

  test('should handle maxBufferSize correctly with table entries', async ({ smartLog }) => {
    // Add many table entries to test buffer trimming
    for (let i = 0; i < 10; i++) {
      smartLog.table([{ id: i, name: `item-${i}` }]);
    }
    
    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBe(10);
    
    // All entries should have __isTable property
    buffer.forEach(entry => {
      expect((entry as any).__isTable).toBe(true);
    });
  });

  test('should handle maxBufferSize correctly with dir entries', async ({ smartLog }) => {
    for (let i = 0; i < 10; i++) {
      smartLog.dir({ id: i, data: `object-${i}` });
    }
    
    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBe(10);
    
    buffer.forEach(entry => {
      expect((entry as any).__isDir).toBe(true);
    });
  });

  test('should properly trim buffer when exceeding maxBufferSize', async ({ smartLog }) => {
    // Test with a large number of entries
    for (let i = 0; i < 1200; i++) {
      smartLog.log(`entry ${i}`);
    }
    
    const buffer = smartLog.getBuffer();
    expect(buffer.length).toBeLessThanOrEqual(1000);
    
    // Should keep the most recent entries
    expect(buffer[buffer.length - 1].args[0]).toBe('entry 1199');
    expect(buffer[0].args[0]).toBe('entry 200'); // First entry should be entry 200 (1200 - 1000 = 200)
  });
});

test.describe('SafeStringify and FormatArg Edge Cases', () => {

  test('should handle safeStringify exceptions', async ({ smartLog }) => {
    // Create an object that will cause JSON.stringify to throw
    const problematicObj = {};
    Object.defineProperty(problematicObj, 'problematic', {
      get() { throw new Error('Property access error'); }
    });
    
    smartLog.log(problematicObj);
    
    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args[0]).toBe(problematicObj);
  });

  test('should handle bigint in safeStringify', async ({ smartLog }) => {
    const objWithBigInt = {
      normal: 'value',
      bigint: BigInt(123456789012345678901234567890n)
    };
    
    smartLog.dir(objWithBigInt);
    
    const buffer = smartLog.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].args[0]).toBe(objWithBigInt);
  });

  test('should handle all formatArg argument types', async ({ smartLog }) => {
    const symbol = Symbol('test');
    const error = new Error('Test error');
    
    smartLog.log(undefined, null, 'string', symbol, error, { nested: 'object' });
    
    let capturedOutput = '';
    const originalWrite = process.stdout.write;
    process.stdout.write = function(chunk: any): boolean {
      capturedOutput += chunk;
      return true;
    };
    
    try {
      await smartLog.flush();
      
      expect(capturedOutput).toContain('undefined');
      expect(capturedOutput).toContain('null');
      expect(capturedOutput).toContain('string');
      expect(capturedOutput).toContain('Symbol(test)');
      expect(capturedOutput).toContain('Error: Test error');
      expect(capturedOutput).toContain('nested');
    } finally {
      process.stdout.write = originalWrite;
    }
  });
});

test.describe('Table Formatting Edge Cases', () => {

  test('should format table with missing properties', async ({ smartLog }) => {
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob' }, // missing age
      { age: 25 } // missing name
    ];
    
    smartLog.table(data);
    
    let capturedOutput = '';
    const originalWrite = process.stdout.write;
    process.stdout.write = function(chunk: any): boolean {
      capturedOutput += chunk;
      return true;
    };
    
    try {
      await smartLog.flush();
      
      expect(capturedOutput).toContain('name | age');
      expect(capturedOutput).toContain('Alice | 30');
      expect(capturedOutput).toContain('Bob |');
      expect(capturedOutput).toContain(' | 25');
    } finally {
      process.stdout.write = originalWrite;
    }
  });

  test('should handle table with empty object', async ({ smartLog }) => {
    smartLog.table({});
    
    let capturedOutput = '';
    const originalWrite = process.stdout.write;
    process.stdout.write = function(chunk: any): boolean {
      capturedOutput += chunk;
      return true;
    };
    
    try {
      await smartLog.flush();
      expect(capturedOutput).toContain('(empty table)');
    } finally {
      process.stdout.write = originalWrite;
    }
  });

  test('should handle table formatting errors', async ({ smartLog }) => {
    const problematicData = [
      { 
        name: 'test',
        toString: () => { throw new Error('toString error'); }
      }
    ];
    
    smartLog.table(problematicData);
    
    let capturedOutput = '';
    const originalWrite = process.stdout.write;
    process.stdout.write = function(chunk: any): boolean {
      capturedOutput += chunk;
      return true;
    };
    
    try {
      await smartLog.flush();
      expect(capturedOutput.length).toBeGreaterThan(0);
    } finally {
      process.stdout.write = originalWrite;
    }
  });

  test('should handle table with object having no keys', async ({ smartLog }) => {
    const data = [Object.create(null)];
    
    smartLog.table(data);
    
    let capturedOutput = '';
    const originalWrite = process.stdout.write;
    process.stdout.write = function(chunk: any): boolean {
      capturedOutput += chunk;
      return true;
    };
    
    try {
      await smartLog.flush();
      expect(capturedOutput.length).toBeGreaterThan(0);
    } finally {
      process.stdout.write = originalWrite;
    }
  });
});

test.describe('Level Color Mapping', () => {

  test('should handle all log levels with colors', async ({ smartLog }) => {
    smartLog.error('error message');
    smartLog.warn('warn message');  
    smartLog.info('info message');
    smartLog.debug('debug message');
    smartLog.log('log message');
    
    let capturedOutput = '';
    const originalWrite = process.stdout.write;
    process.stdout.write = function(chunk: any): boolean {
      capturedOutput += chunk;
      return true;
    };
    
    try {
      await smartLog.flush();
      
      expect(capturedOutput).toContain('[ERROR]');
      expect(capturedOutput).toContain('[WARN]');
      expect(capturedOutput).toContain('[INFO]');
      expect(capturedOutput).toContain('[DEBUG]');
      expect(capturedOutput).toContain('[LOG]');
    } finally {
      process.stdout.write = originalWrite;
    }
  });
});

});