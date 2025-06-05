import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EntryId, OntimeEvent } from 'ontime-types';

import { getTimeOption, OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/types';

export const getCountdownOptions = (timeFormat: string): ViewOption[] => {
  return [
    { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
    {
      title: OptionTitle.DataSources,
      options: [
        {
          id: 'event',
          title: 'Event subscription',
          description: 'The events to follow',
          value: '',
          type: 'persist',
        },
      ],
    },
  ];
};

type CountdownOptions = {
  secondarySource: keyof OntimeEvent | null;
  subscriptions: EntryId[];
  // automatically remove finished events
  // show projected times
};

/**
 * Utility extract the view options from URL Params
 * the names and fallback are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams): CountdownOptions {
  // we manually make an object that matches the key above
  return {
    secondarySource: searchParams.get('secondary-src') as keyof OntimeEvent | null,
    subscriptions: searchParams.getAll('event').filter(Boolean) as EntryId[],
  };
}

/**
 * Hook exposes the backstage view options
 */
export function useCountdownOptions(): CountdownOptions {
  const [searchParams] = useSearchParams();
  const options = useMemo(() => getOptionsFromParams(searchParams), [searchParams]);
  return options;
}
