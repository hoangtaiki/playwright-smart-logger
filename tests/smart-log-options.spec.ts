import { test, expect } from '../src/smart-log';

// smartLogOptions is an option fixture, the only kind Playwright 1.60+ lets a config `use` section (or
// test.use()) set. The legacy `use.smartLog` key is rejected there.
test.describe('SmartLog - smartLogOptions', () => {
  test.describe('set with test.use()', () => {
    test.use({ smartLogOptions: { maxBufferSize: 2 } });

    test('reach the logger', async ({ smartLog }) => {
      smartLog.info('one');
      smartLog.info('two');
      smartLog.info('three');

      const messages = smartLog.getBuffer().map(e => String(e.args[0]));
      expect(messages).toEqual(['two', 'three']);
    });
  });

  test.describe('left unset', () => {
    test('fall back to the defaults', async ({ smartLog }) => {
      for (let i = 0; i < 5; i++) smartLog.info(`entry ${i}`);

      expect(smartLog.getBuffer()).toHaveLength(5);
    });
  });
});
