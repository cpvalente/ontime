import { EndAction, TimerType } from 'ontime-types';

export function validateEndAction(maybeAction: unknown, fallback = EndAction.None) {
  if (typeof maybeAction !== 'string') {
    return fallback;
  }

  const isAction = Object.values(EndAction).includes(maybeAction as EndAction);
  if (isAction) {
    return maybeAction as EndAction;
  }
  return fallback;
}

export function validateTimerType(maybeTimerType: unknown, fallback = TimerType.CountDown) {
  if (typeof maybeTimerType !== 'string') {
    return fallback;
  }

  const isTimerType = Object.values(TimerType).includes(maybeTimerType as TimerType);
  if (isTimerType) {
    return maybeTimerType as TimerType;
  }
  return fallback;
}
