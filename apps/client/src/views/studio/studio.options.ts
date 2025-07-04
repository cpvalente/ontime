import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { getTimeOption } from '../../common/components/view-params-editor/common.options';
import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import { isStringBoolean } from '../../features/viewers/common/viewUtils';

export const getStudioOptions = (timeFormat: string): ViewOption[] => [
  { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
  {
    title: OptionTitle.ElementVisibility,
    collapsible: true,
    options: [
      {
        id: 'hideCards',
        title: 'Hide cards section',
        description: 'Hides the card section with the timers',
        type: 'boolean',
        defaultValue: false,
      },
    ],
  },
];

type StudioOptions = {
  hideCards: boolean;
};

/**
 * Utility extract the view options from URL Params
 * the names and fallback are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams): StudioOptions {
  // we manually make an object that matches the key above
  return {
    hideCards: isStringBoolean(searchParams.get('hideCards')),
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
