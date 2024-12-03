import { SimpleDirection, SimplePlayback, SimpleTimerState } from 'ontime-types';

import { SimpleTimer } from '../SimpleTimer.js';

const makeSimpleTimerState = (patch: Partial<SimpleTimerState>): SimpleTimerState => {
  return {
    duration: 0,
    current: 0,
    addedTime: 0,
    direction: SimpleDirection.CountDown,
    playback: SimplePlayback.Stop,
    ...patch,
  };
};

describe('SimpleTimer count-down', () => {
  let timer: SimpleTimer;

  describe('normal timer flow', () => {
    const initialTime = 1000;
    timer = new SimpleTimer();

    test('setting the timer duration', () => {
      const newState = timer.setTime(initialTime);
      expect(newState).toStrictEqual(
        makeSimpleTimerState({
          duration: initialTime,
          current: initialTime,
        }),
      );
    });

    test('setting the timer to play', () => {
      const newState = timer.start(0);
      expect(newState).toStrictEqual(
        makeSimpleTimerState({
          duration: initialTime,
          current: initialTime,
          playback: SimplePlayback.Start,
        }),
      );
    });

    test('updating the timer', () => {
      let newState = timer.update(100);
      const expected: SimpleTimerState = makeSimpleTimerState({
        duration: initialTime,
        current: initialTime - 100,
        playback: SimplePlayback.Start,
      });

      expect(newState).toStrictEqual(expected);

      newState = timer.update(500);
      expected.current = initialTime - 500;
      expect(newState).toStrictEqual(expected);

      newState = timer.update(1500);
      expected.current = initialTime - 1500;
      expect(newState).toStrictEqual(expected);
    });

    test('pausing the time doesnt affect the current', () => {
      const pausedTime = 200;
      let newState = timer.pause(1500);
      const expected: SimpleTimerState = makeSimpleTimerState({
        duration: initialTime,
        current: initialTime - 1500,
        playback: SimplePlayback.Pause,
      });

      expect(newState).toStrictEqual(expected);

      newState = timer.update(1600);
      expect(newState).toStrictEqual(expected);

      newState = timer.update(1700);
      expect(newState).toStrictEqual(expected);

      newState = timer.start(1700);
      expected.playback = SimplePlayback.Start;
      expect(newState).toStrictEqual(expected);

      newState = timer.update(1800);
      expected.current = initialTime - 1800 + pausedTime;
      expect(newState).toStrictEqual(expected);
    });

    test('stopping the timer clears the running data', () => {
      const newState = timer.stop();
      expect(newState).toStrictEqual(
        makeSimpleTimerState({
          duration: initialTime,
          current: initialTime,
          direction: SimpleDirection.CountDown,
          playback: SimplePlayback.Stop,
        }),
      );
    });

    test('count-up mode', () => {
      const initialState = timer.setDirection(SimpleDirection.CountUp, 0);
      expect(initialState.current).toBe(initialTime);

      let newState = timer.start(0);
      const expected: SimpleTimerState = makeSimpleTimerState({
        duration: initialTime,
        current: initialTime,
        direction: SimpleDirection.CountUp,
        playback: SimplePlayback.Start,
      });

      newState = timer.update(100);
      expected.current = initialTime + 100;
      expect(newState).toStrictEqual(expected);

      expect(newState).toStrictEqual(expected);

      newState = timer.update(500);
      expected.current = initialTime + 500;
      expect(newState).toStrictEqual(expected);

      newState = timer.update(1500);
      expected.current = initialTime + 1500;
      expect(newState).toStrictEqual(expected);
    });

    test('changing direction keeps the current time', () => {
      timer.reset();
      timer.setTime(1000);

      const initialState = timer.setDirection(SimpleDirection.CountUp, 0);
      expect(initialState.current).toBe(1000);

      let newState = timer.start(0);
      expect(newState).toMatchObject({
        duration: 1000,
        current: 1000,
        direction: SimpleDirection.CountUp,
        playback: SimplePlayback.Start,
      });

      newState = timer.update(100);
      expect(newState).toMatchObject({
        duration: 1000,
        current: initialTime + 100,
        direction: SimpleDirection.CountUp,
        playback: SimplePlayback.Start,
      });

      newState = timer.update(500);
      expect(newState).toMatchObject({
        duration: 1000,
        current: 1500,
        direction: SimpleDirection.CountUp,
        playback: SimplePlayback.Start,
      });

      newState = timer.setDirection(SimpleDirection.CountDown, 600);
      expect(newState).toMatchObject({
        duration: 1500,
        current: 1500,
        direction: SimpleDirection.CountDown,
        playback: SimplePlayback.Start,
      });

      newState = timer.update(700);
      expect(newState).toMatchObject({
        duration: 1500,
        current: 1400,
        direction: SimpleDirection.CountDown,
        playback: SimplePlayback.Start,
      });

      newState = timer.setDirection(SimpleDirection.CountUp, 700);
      expect(newState).toMatchObject({
        duration: 1400,
        current: 1400,
        direction: SimpleDirection.CountUp,
        playback: SimplePlayback.Start,
      });

      newState = timer.update(800);
      expect(newState).toMatchObject({
        duration: 1400,
        current: 1500,
        direction: SimpleDirection.CountUp,
        playback: SimplePlayback.Start,
      });
    });

    test('adding time affects final result', () => {
      timer.reset();
      const initialState = timer.state;
      expect(initialState).toStrictEqual(makeSimpleTimerState({}));

      timer.setTime(1000);
      timer.start(0);
      timer.update(100);
      expect(timer.state).toMatchObject({ current: 900, duration: 1000, addedTime: 0 });

      timer.addTime(1000);
      timer.update(200);
      expect(timer.state).toMatchObject({ current: 1800, duration: 1000, addedTime: 1000 });

      timer.update(300);
      expect(timer.state).toMatchObject({ current: 1700, duration: 1000, addedTime: 1000 });

      timer.stop();
      expect(timer.state).toMatchObject({ current: 1000, duration: 1000, addedTime: 0 });
    });
  });
});
