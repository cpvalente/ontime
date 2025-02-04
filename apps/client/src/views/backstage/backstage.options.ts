import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomFields, OntimeEvent } from 'ontime-types';

import {
  getTimeOption,
  makeOptionsFromCustomFields,
  OptionTitle,
} from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/types';

export const getBackstageOptions = (timeFormat: string, customFields: CustomFields): ViewOption[] => {
  const secondaryOptions = makeOptionsFromCustomFields(customFields, { note: 'Note' });

  return [
    { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
    {
      title: OptionTitle.DataSources,
      collapsible: true,
      options: [
        {
          id: 'secondary-src',
          title: 'Event secondary text',
          description: 'Select the data source for auxiliary text shown in now and next cards',
          type: 'option',
          values: secondaryOptions,
          defaultValue: '',
        },
      ],
    },

    {
      title: OptionTitle.Schedule,
      collapsible: true,
      options: [
        {
          id: 'eventsPerPage',
          title: 'Events per page',
          description: 'Sets the number of events on the page, can cause overflow',
          type: 'number',
          placeholder: '8 (default)',
        },
        {
          id: 'hidePast',
          title: 'Hide past events',
          description: 'Scheduler will only show upcoming events',
          type: 'boolean',
          defaultValue: false,
        },
        {
          id: 'stopCycle',
          title: 'Stop cycling through event pages',
          description: 'Schedule will not auto-cycle through events',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
  ];
};

type BackstageOptions = {
  secondarySource: keyof OntimeEvent | null;
};

/**
 * Utility extract the view options from URL Params
 * the names and fallbacks are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams): BackstageOptions {
  // we manually make an object that matches the key above
  return {
    secondarySource: searchParams.get('secondary-src') as keyof OntimeEvent | null,
  };
}

/**
 * Hook exposes the backstage view options
 */
export function useBackstageOptions(): BackstageOptions {
  const [searchParams] = useSearchParams();
  const options = useMemo(() => getOptionsFromParams(searchParams), [searchParams]);
  return options;
}
