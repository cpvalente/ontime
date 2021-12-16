import {Timer} from "../Timer";

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
  expect(Timer.toSeconds(9016)).toBe(10);
  expect(Timer.toSeconds(8016)).toBe(9);
  expect(Timer.toSeconds(7010)).toBe(8);
  expect(Timer.toSeconds(6006)).toBe(7);
  expect(Timer.toSeconds(4999)).toBe(5);
  expect(Timer.toSeconds(2995)).toBe(3);
  expect(Timer.toSeconds(1991)).toBe(2);
  expect(Timer.toSeconds(992)).toBe(1);
  expect(Timer.toSeconds(127)).toBe(1);
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