import { getTimeOption, hideTimerSeconds } from '../../../common/components/view-params-editor/constants';
import type { ViewOption } from '../../../common/components/view-params-editor/types';

export const getStudioClockOptions = (timeFormat: string): ViewOption[] => [
  { section: 'Clock Options' },
  getTimeOption(timeFormat),
  { section: 'Timer Options' },
  hideTimerSeconds,
];
