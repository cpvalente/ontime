import { formatTime } from '../time';

describe('formatTime()', () => {
  test('parses 24h strings', () => {
    const ms = 13 * 60 * 60 * 1000;
    const to12h = false;
    const options = {
      showSeconds: true,
      format: 'irrelevant',
    };
    const time = formatTime(ms, to12h, options);
    expect(time).toStrictEqual('13:00:00');
  });

  test('parses same string in 12h strings', () => {
    const ms = 13 * 60 * 60 * 1000;
    const to12h = true;
    const options = {
      showSeconds: true,
      format: 'hh:mm:ss a',
    };
    const time = formatTime(ms, to12h, options);
    expect(time).toStrictEqual('01:00:00 PM');
  });
});
