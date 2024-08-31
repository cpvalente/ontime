import { getTimeOption, hideTimerSeconds } from '../../../common/components/view-params-editor/constants';
import type { ViewOption } from '../../../common/components/view-params-editor/types';

export const getStudioClockOptions = (timeFormat: string): ViewOption[] => [
  { section: 'Clock Options' },
  getTimeOption(timeFormat),
  { section: 'Timer Options' },
  hideTimerSeconds,
  { section: 'Element visibility' },
  {
    id: 'hideRight',
    title: 'Hide right section',
    description: 'Hides the right section with On Air indicator and the schedule',
    type: 'boolean',
    defaultValue: false,
  },
];
