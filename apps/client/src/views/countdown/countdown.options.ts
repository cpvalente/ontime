import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomFields, EntryId, OntimeEvent } from 'ontime-types';

import {
  getTimeOption,
  makeOptionsFromCustomFields,
  OptionTitle,
} from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/types';
import { isStringBoolean } from '../../features/viewers/common/viewUtils';

export const getCountdownOptions = (timeFormat: string, customFields: CustomFields): ViewOption[] => {
  const secondaryOptions = makeOptionsFromCustomFields(customFields, { note: 'Note' });

  return [
    { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
    {
      title: OptionTitle.DataSources,
      collapsible: true,
      options: [
        {
          id: 'sub',
          title: 'Event subscription',
          description: 'The events to follow',
          value: '',
          type: 'persist',
        },
        {
          // TODO: adding a secondary source is removing the subscriptions
          // this seems to be a bug with persist assuming that the property has a single entry
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
      title: OptionTitle.ElementVisibility,
      collapsible: true,
      options: [
        {
          id: 'followSelected',
          title: 'Follow selected event',
          description: 'Whether the view should automatically scroll to the selected event',
          type: 'boolean',
          defaultValue: false,
        },
        {
          id: 'hidePast',
          title: 'Hide Past Events',
          description: 'Whether to hide events that have passed',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
    {
      title: OptionTitle.BehaviourOptions,
      collapsible: true,
      options: [
        {
          id: 'showProjected',
          title: 'Show projected time',
          description: 'Whether scheduled times should account for runtime offset',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
  ];
};

type CountdownOptions = {
  subscriptions: EntryId[];
  secondarySource: keyof OntimeEvent | null;
  showProjected: boolean;
  followSelected: boolean;
  hidePast: boolean;
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
    showProjected: isStringBoolean(searchParams.get('showProjected')),
    followSelected: isStringBoolean(searchParams.get('followSelected')),
    hidePast: isStringBoolean(searchParams.get('hidePast')),
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
