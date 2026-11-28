import { EndAction, type RundownDefaults, TimeStrategy, TimerType } from 'ontime-types';

import { MILLIS_PER_MINUTE } from '../date-utils/conversionUtils.js';

export const defaultRundownDefaults: Readonly<RundownDefaults> = {
  duration: 10 * MILLIS_PER_MINUTE,
  linkPrevious: true,
  timeStrategy: TimeStrategy.LockDuration,
  timerType: TimerType.CountDown,
  endAction: EndAction.None,
  inheritGroupColour: false,
};
