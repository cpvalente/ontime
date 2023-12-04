import { formatTime } from '../time';

describe('formatTime()', () => {
  it('parses 24h strings', () => {
    const ms = 13 * 60 * 60 * 1000;
    const options = {
      showSeconds: true,
      format: 'irrelevant',
    };
    const time = formatTime(ms, options, () => '24');
    expect(time).toStrictEqual('13:00:00');
  });

  it('parses same string in 12h strings', () => {
    const ms = 13 * 60 * 60 * 1000;
    const options = {
      showSeconds: true,
      format: 'hh:mm:ss a',
    };
    const time = formatTime(ms, options, () => '12');
    expect(time).toStrictEqual('01:00:00 PM');
  });

  it('handles null times', () => {
    const ms = null;
    const time = formatTime(ms);
    expect(time).toStrictEqual('...');
  });

  it('shows 12h format without times', () => {
    const ms = 13 * 60 * 60 * 1000;
    const options = {
      showSeconds: false,
      format: 'hh:mm a',
    };
    const time = formatTime(ms, options, () => '12');
    expect(time).toStrictEqual('01:00 PM');
  });
});
