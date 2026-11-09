import { SimpleDirection, SimplePlayback } from 'ontime-types';

import { addTime, createAuxTimer, getCurrent, pause, setDirection, setTime, start, stop } from '../auxTimer.utils.js';

describe('aux timer', () => {
  const timer = createAuxTimer(10_000);

  it('counts down from its duration while running, and freezes when paused', () => {
    const running = start(timer, 1000);
    expect(getCurrent(running, 4000)).toBe(7000);

    const paused = pause(running, 4000);
    expect(paused).toMatchObject({ playback: SimplePlayback.Pause, value: 7000, startedAt: null });
    expect(getCurrent(paused, 60_000)).toBe(7000);

    expect(getCurrent(start(paused, 60_000), 61_000)).toBe(6000);
  });

  it('counts up from its duration', () => {
    const running = start(setDirection(timer, SimpleDirection.CountUp, 0), 1000);
    expect(getCurrent(running, 4000)).toBe(13_000);
  });

  it('counts from its value in the new direction, keeping the time set', () => {
    const running = start(timer, 0);
    const turned = setDirection(running, SimpleDirection.CountUp, 4000);

    expect(turned).toMatchObject({ duration: 10_000, value: 6000, startedAt: 4000 });
    expect(getCurrent(turned, 5000)).toBe(7000);
    expect(stop(turned)).toMatchObject({ duration: 10_000, value: 10_000 });
  });

  it('keeps a paused value when its direction changes', () => {
    const paused = pause(start(timer, 0), 2000);
    const turned = setDirection(paused, SimpleDirection.CountUp, 5000);

    expect(getCurrent(turned, 5000)).toBe(8000);
    expect(getCurrent(start(turned, 6000), 7000)).toBe(9000);
  });

  it('adds time to the current value, and a stop returns to the time set', () => {
    const running = addTime(start(timer, 0), 5000);
    expect(getCurrent(running, 1000)).toBe(14_000);
    expect(running.duration).toBe(10_000);

    expect(getCurrent(stop(running), 2000)).toBe(10_000);
  });

  it('sets the time, a running timer counts from it now', () => {
    expect(setTime(timer, 20_000, 0)).toMatchObject({ duration: 20_000, value: 20_000, startedAt: null });

    const running = setTime(start(timer, 0), 20_000, 5000);
    expect(getCurrent(running, 6000)).toBe(19_000);

    const paused = setTime(pause(start(timer, 0), 2000), 20_000, 5000);
    expect(getCurrent(start(paused, 6000), 7000)).toBe(19_000);
  });

  it('a saved running timer counts the time it was not watched', () => {
    const saved = JSON.parse(JSON.stringify(start(timer, 1000)));
    expect(getCurrent(saved, 61_000)).toBe(-50_000);
  });

  it('ignores a start while running and a pause while not running', () => {
    const running = start(timer, 0);
    expect(start(running, 5000)).toBe(running);
    expect(pause(timer, 5000)).toBe(timer);
  });
});
