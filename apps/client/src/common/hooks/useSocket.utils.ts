import { RuntimeStore, TimerType } from 'ontime-types';

type TimerDisplaySource = Pick<RuntimeStore, 'eventNow' | 'groupNow' | 'groupTimer' | 'timer'>;

export function resolveTimerDisplay(state: TimerDisplaySource) {
  const eventTimerType = state.eventNow?.timerType ?? TimerType.CountDown;

  if (state.groupNow?.useGroupTimer === true && state.groupTimer !== null) {
    return {
      time: state.groupTimer,
      timerType: state.groupNow.timerType,
      countToEnd: false,
      usesGroupTimer: true,
      eventTimer: state.timer,
      eventTimerType,
    };
  }

  return {
    time: state.timer,
    timerType: eventTimerType,
    countToEnd: state.eventNow?.countToEnd ?? false,
    usesGroupTimer: false,
    eventTimer: state.timer,
    eventTimerType,
  };
}
