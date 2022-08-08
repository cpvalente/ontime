import { Timer } from '../Timer';
import { formatTime } from '../../../../client/src/common/utils/time';

test('object instantiates correctly', () => {
  const t = new Timer();

  expect(t.clock).toBeNull;
  expect(t.duration).toBeNull;
  expect(t.current).toBeNull;
  expect(t.timeTag).toBeNull;
  expect(t.secondaryTimer).toBeNull;
  expect(t._secondaryTarget).toBeNull;
  expect(t._finishAt).toBeNull;
  expect(t._finishedAt).toBeNull;
  expect(t._finishedFlag).toBeFalsy;
  expect(t._startedAt).toBeNull;
  expect(t._pausedAt).toBeNull;
  expect(t._pausedInterval).toBeNull;
  expect(t._pausedTotal).toBeNull;
  expect(t.state).toBe('stop');
});

test('convert between mills and seconds correctly', () => {
  expect(Timer.toSeconds(10000)).toBe(10);
  expect(Timer.toSeconds(9016)).toBe(9);
  expect(Timer.toSeconds(8016)).toBe(8);
  expect(Timer.toSeconds(7010)).toBe(7);
  expect(Timer.toSeconds(6006)).toBe(6);
  expect(Timer.toSeconds(4999)).toBe(4);
  expect(Timer.toSeconds(2995)).toBe(2);
  expect(Timer.toSeconds(1991)).toBe(1);
  expect(Timer.toSeconds(992)).toBe(0);
  expect(Timer.toSeconds(127)).toBe(0);
  expect(Timer.toSeconds(0)).toBe(0);
  expect(Timer.toSeconds(-0)).toBe(-0);
  expect(Timer.toSeconds(-127)).toBe(-0);
  expect(Timer.toSeconds(-992)).toBe(-0);
  expect(Timer.toSeconds(-1991)).toBe(-1);
  expect(Timer.toSeconds(-2995)).toBe(-2);
  expect(Timer.toSeconds(-4999)).toBe(-4);
  expect(Timer.toSeconds(-6006)).toBe(-6);
  expect(Timer.toSeconds(-7010)).toBe(-7);
  expect(Timer.toSeconds(-8016)).toBe(-8);
  expect(Timer.toSeconds(-10000)).toBe(-10);
});

test('converting between millis to seconds handles partials correctly', () => {
  const finish = 82162001;
  const now = 80364519;
  const runningMs = finish - now;
  expect(Timer.toSeconds(runningMs)).toBe(1797);

  expect(Timer.toSeconds(1800000)).toBe(1800);
  expect(Timer.toSeconds(1799761)).toBe(1799);
});

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
    const to12h = false;
    const options = {
      showSeconds: true,
      format: 'hh:mm:ss a',
    };
    const time = formatTime(ms, to12h, options);
    expect(time).toStrictEqual('01:00:00 PM');
  });
});
