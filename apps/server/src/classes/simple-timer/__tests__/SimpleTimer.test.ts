import { SimpleDirection, SimplePlayback, SimpleTimerState } from 'ontime-types';

import { SimpleTimer } from '../SimpleTimer.js';

describe('SimpleTimer count-down', () => {
  let timer: SimpleTimer;

  describe('normal timer flow', () => {
    const initialTime = 1000;
    timer = new SimpleTimer();

    test('setting the timer duration', () => {
      const newState = timer.setTime(initialTime);
      const expected: SimpleTimerState = {
        duration: initialTime,
        current: initialTime,
        direction: SimpleDirection.CountDown,
        playback: SimplePlayback.Stop,
      };
      expect(newState).toStrictEqual(expected);
    });

    test('setting the timer to play', () => {
      const newState = timer.start(0);
      const expected: SimpleTimerState = {
        duration: initialTime,
        current: initialTime,
        direction: SimpleDirection.CountDown,
        playback: SimplePlayback.Start,
      };
      expect(newState).toStrictEqual(expected);
    });

    test('updating the timer', () => {
      let newState = timer.update(100);
      const expected: SimpleTimerState = {
        duration: initialTime,
        current: initialTime - 100,
        direction: SimpleDirection.CountDown,
        playback: SimplePlayback.Start,
      };
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
      const expected: SimpleTimerState = {
        duration: initialTime,
        current: initialTime - 1500,
        direction: SimpleDirection.CountDown,
        playback: SimplePlayback.Pause,
      };
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
      const expected: SimpleTimerState = {
        duration: initialTime,
        current: initialTime,
        direction: SimpleDirection.CountDown,
        playback: SimplePlayback.Stop,
      };
      expect(newState).toStrictEqual(expected);
    });

    test('count-up mode', () => {
      const initialState = timer.setDirection(SimpleDirection.CountUp);
      expect(initialState.current).toBe(initialTime);

      let newState = timer.start(0);
      const expected: SimpleTimerState = {
        duration: initialTime,
        current: initialTime,
        direction: SimpleDirection.CountUp,
        playback: SimplePlayback.Start,
      };

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

    test('changing direction stops the timer', () => {
      const newState = timer.setDirection(SimpleDirection.CountDown);
      const expected: SimpleTimerState = {
        duration: initialTime,
        current: initialTime,
        direction: SimpleDirection.CountDown,
        playback: SimplePlayback.Stop,
      };

      expect(newState).toStrictEqual(expected);
    });
  });
});
