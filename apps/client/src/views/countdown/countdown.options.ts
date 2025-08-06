import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomFields, EntryId, OntimeEvent } from 'ontime-types';

import { getTimeOption } from '../../common/components/view-params-editor/common.options';
import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import { makeOptionsFromCustomFields } from '../../common/components/view-params-editor/viewParams.utils';
import { isStringBoolean } from '../../features/viewers/common/viewUtils';

export const getCountdownOptions = (
  timeFormat: string,
  customFields: CustomFields,
  persistedSubscriptions: EntryId[],
): ViewOption[] => {
  const secondaryOptions = makeOptionsFromCustomFields(customFields, [{ value: 'note', label: 'Note' }]);

  return [
    { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
    {
      title: OptionTitle.DataSources,
      collapsible: true,
      options: [
        {
          id: 'secondary-src',
          title: 'Event secondary text',
          description: 'Select the data source for auxiliary text shown in the card',
          type: 'option',
          values: secondaryOptions,
          defaultValue: '',
        },
      ],
    },
    {
      title: OptionTitle.BehaviourOptions,
      collapsible: true,
      options: [
        {
          id: 'showExpected',
          title: 'Show expected time',
          description: 'Whether the times shown should account for the runtime offset.',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
    {
      title: OptionTitle.Hidden,
      options: [
        {
          id: 'sub',
          title: 'Event subscription',
          description: 'The events to follow',
          values: persistedSubscriptions,
          type: 'persist',
        },
      ],
    },
  ];
};

type CountdownOptions = {
  subscriptions: EntryId[];
  secondarySource: keyof OntimeEvent | null;
  showExpected: boolean;
};

/**
 * Utility extract the view options from URL Params
 * the names and fallback are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams): CountdownOptions {
  // we manually make an object that matches the key above
  return {
    subscriptions: searchParams.getAll('sub') as EntryId[],
    secondarySource: searchParams.get('secondary-src') as keyof OntimeEvent | null,
    showExpected: isStringBoolean(searchParams.get('showExpected')),
  };
}

/**
 * Hook exposes the countdown view options
 */
export function useCountdownOptions(): CountdownOptions {
  const [searchParams] = useSearchParams();
  const options = useMemo(() => getOptionsFromParams(searchParams), [searchParams]);
  return options;
}
