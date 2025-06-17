import { getTimeOption, hideTimerSeconds } from '../../../common/components/view-params-editor/common.options';
import { OptionTitle } from '../../../common/components/view-params-editor/constants';
import type { ViewOption } from '../../../common/components/view-params-editor/viewParams.types';

export const getStudioClockOptions = (timeFormat: string): ViewOption[] => [
  { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
  { title: OptionTitle.TimerOptions, collapsible: true, options: [hideTimerSeconds] },
  {
    title: OptionTitle.ElementVisibility,
    collapsible: true,
    options: [
      {
        id: 'hideRight',
        title: 'Hide right section',
        description: 'Hides the right section with On Air indicator and the schedule',
        type: 'boolean',
        defaultValue: false,
      },
    ],
  },
];
