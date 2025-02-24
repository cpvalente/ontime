import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getTimeOption, hideTimerSeconds, OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/types';
import { isStringBoolean } from '../../features/viewers/common/viewUtils';

export const getStudioOptions = (timeFormat: string): ViewOption[] => [
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

type StudioOptions = {
  clockOptions: string;
  hideTimerSeconds: boolean;
  hideRight: boolean;
};

/**
 * Utility extract the view options from URL Params
 * the names and fallback are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams): StudioOptions {
  // we manually make an object that matches the key above
  return {
    timeformat: searchParams.get('timeformat'),
    hideTimerSeconds: isStringBoolean(searchParams.get('hideTimerSeconds')),
    hideRight: isStringBoolean(searchParams.get('hideRight')),
  };
}

/**
 * Hook exposes the backstage view options
 */
export function useStudioOptions(): StudioOptions {
  const [searchParams] = useSearchParams();
  const options = useMemo(() => getOptionsFromParams(searchParams), [searchParams]);
  return options;
}
