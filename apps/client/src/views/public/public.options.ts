import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomFields, OntimeEvent } from 'ontime-types';

import {
  getTimeOption,
  makeOptionsFromCustomFields,
  OptionTitle,
} from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/types';
import { scheduleOptions } from '../common/schedule/schedule.options';

export const getPublicOptions = (timeFormat: string, customFields: CustomFields): ViewOption[] => {
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
    scheduleOptions,
  ];
};

type PublicOptions = {
  secondarySource: keyof OntimeEvent | null;
};

/**
 * Utility extract the view options from URL Params
 * the names and fallback are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams): PublicOptions {
  // we manually make an object that matches the key above
  return {
    secondarySource: searchParams.get('secondary-src') as keyof OntimeEvent | null,
  };
}

/**
 * Hook exposes the backstage view options
 */
export function usePublicOptions(): PublicOptions {
  const [searchParams] = useSearchParams();
  const options = useMemo(() => getOptionsFromParams(searchParams), [searchParams]);
  return options;
}
