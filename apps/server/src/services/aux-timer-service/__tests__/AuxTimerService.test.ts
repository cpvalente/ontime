import { SimpleDirection, SimplePlayback, SimpleTimerState } from 'ontime-types';

import { AuxTimerService } from '../AuxTimerService.js';

/**
 * These tests characterise the behaviour of the `@broadcastReturn` decorator applied
 * to the public methods of AuxTimerService:
 * - the decorated method emits its own return value
 * - the emit key is derived from the *last* argument of the call
 * - the return value of the decorated method is the value of the original method
 * - private methods (`update`) are not decorated and emit a patch instead
 */

type Emitted = Record<string, SimpleTimerState>;

function makeService() {
  // the emitted state objects are live references into SimpleTimer,
  // so we clone on capture to keep an accurate record of each emit
  const emitted: Emitted[] = [];
  const emit = vi.fn((state) => {
    emitted.push(structuredClone(state) as Emitted);
  });

  let now = 0;
  const getTime = () => now;
  const setTime = (value: number) => {
    now = value;
  };

  const service = new AuxTimerService(emit, getTime);
  return { service, emit, emitted, setTime };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AuxTimerService decorated methods', () => {
  describe('emit key resolution', () => {
    it.each([1, 2, 3])('start(%i) emits under the matching auxtimer key', (index) => {
      const { service, emit, emitted } = makeService();

      const result = service.start(index);

      expect(emit).toHaveBeenCalledTimes(1);
      expect(Object.keys(emitted[0])).toEqual([`auxtimer${index}`]);
      expect(emitted[0][`auxtimer${index}`]).toMatchObject({ playback: SimplePlayback.Start });
      // the decorator emits exactly what the original method returned
      expect(result).toMatchObject({ playback: SimplePlayback.Start });
    });

    it('resolves the key from the last argument, not from a fixed position', () => {
      const { service, emitted } = makeService();

      service.setTime(1000, 2);
      service.addTime(500, 3);
      service.setDirection(SimpleDirection.CountUp, 1);

      expect(Object.keys(emitted[0])).toEqual(['auxtimer2']);
      expect(Object.keys(emitted[1])).toEqual(['auxtimer3']);
      expect(Object.keys(emitted[2])).toEqual(['auxtimer1']);
    });

    it('keeps the three timers isolated from each other', () => {
      const { service, emitted } = makeService();

      service.setTime(1000, 1);
      service.setTime(2000, 2);
      service.setTime(3000, 3);

      expect(emitted[0].auxtimer1.duration).toBe(1000);
      expect(emitted[1].auxtimer2.duration).toBe(2000);
      expect(emitted[2].auxtimer3.duration).toBe(3000);
    });
  });

  describe('emit payload matches the return value', () => {
    it('setTime returns and emits the new duration', () => {
      const { service, emit, emitted } = makeService();

      const result = service.setTime(5000, 1);

      expect(emit).toHaveBeenCalledTimes(1);
      expect(result.duration).toBe(5000);
      expect(result.current).toBe(5000);
      expect(emitted[0].auxtimer1).toMatchObject({ duration: 5000, current: 5000 });
    });

    it('setDirection returns and emits the new direction', () => {
      const { service, emitted } = makeService();

      const result = service.setDirection(SimpleDirection.CountUp, 1);

      expect(result.direction).toBe(SimpleDirection.CountUp);
      expect(emitted[0].auxtimer1.direction).toBe(SimpleDirection.CountUp);
    });

    it('pause returns and emits the paused state', () => {
      const { service, emit, emitted, setTime } = makeService();

      service.setTime(10000, 1);
      service.start(1);
      setTime(2000);
      const result = service.pause(1);

      expect(emit).toHaveBeenCalledTimes(3);
      expect(result.playback).toBe(SimplePlayback.Pause);
      expect(emitted[2].auxtimer1.playback).toBe(SimplePlayback.Pause);
    });

    it('stop returns and emits the reset state', () => {
      const { service, emitted, setTime } = makeService();

      service.setTime(10000, 1);
      service.start(1);
      setTime(2000);
      const result = service.stop(1);

      expect(result.playback).toBe(SimplePlayback.Stop);
      expect(result.current).toBe(10000);
      expect(emitted.at(-1)?.auxtimer1).toMatchObject({ playback: SimplePlayback.Stop, current: 10000 });
    });

    it('addTime on a running timer emits the recalculated value', () => {
      const { service, emitted, setTime } = makeService();

      service.setTime(10000, 1);
      service.start(1);
      setTime(2000);

      const result = service.addTime(5000, 1);

      // running timers are updated against the current time before emitting
      expect(result.duration).toBe(15000);
      expect(result.current).toBe(13000);
      expect(emitted.at(-1)?.auxtimer1).toMatchObject({ duration: 15000, current: 13000 });
    });

    it('addTime on a stopped timer emits without recalculating', () => {
      const { service, emitted, setTime } = makeService();

      service.setTime(10000, 1);
      setTime(2000);

      const result = service.addTime(5000, 1);

      expect(result.duration).toBe(15000);
      expect(result.current).toBe(15000);
      expect(emitted.at(-1)?.auxtimer1).toMatchObject({ duration: 15000, current: 15000 });
    });
  });

  describe('every decorated call emits exactly once', () => {
    it('emits one message per public call', () => {
      const { service, emit } = makeService();

      service.setTime(10000, 1);
      service.setDirection(SimpleDirection.CountUp, 1);
      service.start(1);
      service.addTime(1000, 1);
      service.pause(1);
      service.stop(1);

      expect(emit).toHaveBeenCalledTimes(6);
    });

    it('emits even when the underlying timer refused the operation', () => {
      const { service, emit, emitted } = makeService();

      // pausing a stopped timer is a no-op in SimpleTimer, the decorator still emits
      const result = service.pause(1);

      expect(emit).toHaveBeenCalledTimes(1);
      expect(result.playback).toBe(SimplePlayback.Stop);
      expect(emitted[0].auxtimer1.playback).toBe(SimplePlayback.Stop);
    });
  });

  describe('interval driven updates are not decorated', () => {
    it('emits a combined patch for all running timers', () => {
      const { service, emit, emitted, setTime } = makeService();

      service.setTime(10000, 1);
      service.setTime(20000, 2);
      service.start(1);
      service.start(2);
      emit.mockClear();
      emitted.length = 0;

      setTime(1000);
      vi.advanceTimersByTime(500);

      expect(emit).toHaveBeenCalledTimes(1);
      // a single patch carrying both running timers, rather than one emit per timer
      expect(Object.keys(emitted[0]).sort()).toEqual(['auxtimer1', 'auxtimer2']);
      expect(emitted[0].auxtimer1.current).toBe(9000);
      expect(emitted[0].auxtimer2.current).toBe(19000);
    });

    it('does not emit when no timer is running', () => {
      const { service, emit } = makeService();

      service.setTime(10000, 1);
      service.start(1);
      service.stop(1);
      emit.mockClear();

      vi.advanceTimersByTime(2000);

      expect(emit).not.toHaveBeenCalled();
    });

    it('keeps ticking while another timer is still running', () => {
      const { service, emit, emitted, setTime } = makeService();

      service.setTime(10000, 1);
      service.setTime(20000, 2);
      service.start(1);
      service.start(2);
      service.stop(1);
      emit.mockClear();
      emitted.length = 0;

      setTime(1000);
      vi.advanceTimersByTime(500);

      expect(emit).toHaveBeenCalledTimes(1);
      expect(Object.keys(emitted[0])).toEqual(['auxtimer2']);
    });
  });
});
