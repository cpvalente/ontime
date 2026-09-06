import { Playback, RuntimeStore, TimerPhase, TimerType, runtimeStorePlaceholder } from 'ontime-types';

import { resolveTimerDisplay } from '../useSocket.utils';

const eventTimer = { ...runtimeStorePlaceholder.timer, current: 5_000 };
const groupTimer = {
  ...runtimeStorePlaceholder.timer,
  current: 25_000,
  phase: TimerPhase.Default,
  playback: Playback.Play,
};

function makeState(patch: Partial<RuntimeStore> = {}): RuntimeStore {
  return {
    ...runtimeStorePlaceholder,
    timer: eventTimer,
    eventNow: {
      id: 'event-1',
      timerType: TimerType.CountUp,
      countToEnd: true,
    } as RuntimeStore['eventNow'],
    ...patch,
  };
}

describe('resolveTimerDisplay()', () => {
  it('uses the event timer by default', () => {
    expect(resolveTimerDisplay(makeState())).toMatchObject({
      time: eventTimer,
      timerType: TimerType.CountUp,
      countToEnd: true,
      usesGroupTimer: false,
    });
  });

  it('uses the group timer and display type when enabled', () => {
    const display = resolveTimerDisplay(
      makeState({
        groupNow: { useGroupTimer: true, timerType: TimerType.CountDown } as RuntimeStore['groupNow'],
        groupTimer,
      }),
    );

    expect(display).toMatchObject({
      time: groupTimer,
      timerType: TimerType.CountDown,
      countToEnd: false,
      usesGroupTimer: true,
      eventTimer,
      eventTimerType: TimerType.CountUp,
    });
  });

  it('ignores a group timer when the group setting is disabled', () => {
    const display = resolveTimerDisplay(
      makeState({
        groupNow: { useGroupTimer: false, timerType: TimerType.CountDown } as RuntimeStore['groupNow'],
        groupTimer,
      }),
    );

    expect(display.time).toBe(eventTimer);
    expect(display.usesGroupTimer).toBe(false);
  });

  it('falls back entirely to the event display while group timer data is unavailable', () => {
    const display = resolveTimerDisplay(
      makeState({
        groupNow: { useGroupTimer: true, timerType: TimerType.CountDown } as RuntimeStore['groupNow'],
        groupTimer: null,
      }),
    );

    expect(display).toMatchObject({
      time: eventTimer,
      timerType: TimerType.CountUp,
      countToEnd: true,
      usesGroupTimer: false,
    });
  });
});
