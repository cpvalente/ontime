import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import { isStringBoolean } from '../../features/viewers/common/viewUtils';

/**
 * In the specific case of the cuesheet options
 * we save the user preferences in the local storage
 */
export const cuesheetOptions: ViewOption[] = [
  {
    title: OptionTitle.ElementVisibility,
    collapsible: true,
    options: [
      {
        id: 'showActionMenu',
        title: 'Show action menu',
        description: 'Whether to show the action menu for every row in the table',
        type: 'boolean',
        defaultValue: false,
      },
      {
        id: 'hideTableSeconds',
        title: 'Hide seconds in table',
        description: 'Whether to hide seconds in the time fields displayed in the table',
        type: 'boolean',
        defaultValue: false,
      },
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
      {
        id: 'hideIndexColumn',
        title: 'Hide index column',
        description: 'Whether the hide the event indexes in the table',
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
        id: 'showDelayedTimes',
        title: 'Show delayed times',
        description: 'Whether the time fields should include delays',
        type: 'boolean',
        defaultValue: false,
      },
      {
        id: 'hideDelays',
        title: 'Hide delays',
        description: 'Whether to hide the rows containing scheduled delays',
        type: 'boolean',
        defaultValue: false,
      },
    ],
  },
];

type CuesheetOptions = {
  showActionMenu: boolean;
  hideTableSeconds: boolean;
  followSelected: boolean;
  hidePast: boolean;
  hideIndexColumn: boolean;
  showDelayedTimes: boolean;
  hideDelays: boolean;
};

/**
 * Utility extract the view options from URL Params
 * the names and fallbacks are manually matched with cuesheetOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams): CuesheetOptions {
  // we manually make an object that matches the key above
  return {
    showActionMenu: isStringBoolean(searchParams.get('showActionMenu')),
    hideTableSeconds: isStringBoolean(searchParams.get('hideTableSeconds')),
    followSelected: isStringBoolean(searchParams.get('followSelected')),
    hidePast: isStringBoolean(searchParams.get('hidePast')),
    hideIndexColumn: isStringBoolean(searchParams.get('hideIndexColumn')),
    showDelayedTimes: isStringBoolean(searchParams.get('showDelayedTimes')),
    hideDelays: isStringBoolean(searchParams.get('hideDelays')),
  };
}

/**
 * Hook exposes the cuesheet view options
 */
export function useCuesheetOptions(): CuesheetOptions {
  const [searchParams] = useSearchParams();
  const options = useMemo(() => getOptionsFromParams(searchParams), [searchParams]);
  return options;
}
