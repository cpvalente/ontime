import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { CustomFields, EntryId, OntimeEvent } from 'ontime-types';

import { getTimeOption } from '../../common/components/view-params-editor/common.options';
import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import { makeOptionsFromCustomFields } from '../../common/components/view-params-editor/viewParams.utils';
import { PresetContext } from '../../common/context/PresetContext';
import { isStringBoolean } from '../../features/viewers/common/viewUtils';
import { CountdownSubscription } from './countdown.utils';

export const getCountdownOptions = (
  timeFormat: string,
  customFields: CustomFields,
  persistedSubscriptions: CountdownSubscription,
): ViewOption[] => {
  const secondaryOptions = makeOptionsFromCustomFields(customFields, [
    { value: 'none', label: 'None' },
    { value: 'note', label: 'Note' },
  ]);

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
          defaultValue: 'none',
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
          values: persistedSubscriptions === 'all' ? ['all'] : persistedSubscriptions,
          type: 'persist',
        },
      ],
    },
  ];
};

type CountdownOptions = {
  subscriptions: CountdownSubscription;
  secondarySource: keyof OntimeEvent | null;
  showExpected: boolean;
};

/**
 * Utility extract the view options from URL Params
 * the names and fallback are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams, defaultValues?: URLSearchParams): CountdownOptions {
  // Helper to get single value from either source, prioritizing defaultValues
  const getValue = (key: string) => defaultValues?.get(key) ?? searchParams.get(key);

  // Helper to get array values from either source
  const getArrayValues = (key: string): EntryId[] => {
    if (defaultValues?.has(key)) {
      return defaultValues.getAll(key) as EntryId[];
    }
    return searchParams.getAll(key) as EntryId[];
  };

  const subscriptions = getArrayValues('sub');

  return {
    subscriptions: subscriptions.at(0) === 'all' ? 'all' : subscriptions,
    secondarySource: getValue('secondary-src') as keyof OntimeEvent | null,
    showExpected: isStringBoolean(getValue('showExpected')),
  };
}

/**
 * Hook exposes the countdown view options
 */
export function useCountdownOptions(): CountdownOptions {
  const [searchParams] = useSearchParams();
  const maybePreset = use(PresetContext);

  const options = useMemo(() => {
    const defaultValues = maybePreset ? new URLSearchParams(maybePreset.search) : undefined;
    return getOptionsFromParams(searchParams, defaultValues);
  }, [maybePreset, searchParams]);

  return options;
}
