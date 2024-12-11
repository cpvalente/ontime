import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ViewOption } from '../../common/components/view-params-editor/types';
import { booleanFromLocalStorage } from '../../common/utils/localStorage';
import { isStringBoolean } from '../../features/viewers/common/viewUtils';

enum CuesheetKeys {
  Follow = 'ontime-cuesheet-follow-selected',
  DelayVisibility = 'ontime-cuesheet-show-delay',
  PreviousVisibility = 'ontime-cuesheet-show-previous',
  ColumnIndex = 'ontime-cuesheet-show-index-column',
  DelayedTimes = 'ontime-cuesheet-show-delayed',
  Seconds = 'ontime-cuesheet-hide-seconds',
}

/**
 * In the specific case of the cuesheet options
 * we save the user preferences in the local storage
 */
export const cuesheetOptions: ViewOption[] = [
  { section: 'Table options' },
  {
    id: 'hideTableSeconds',
    title: 'Hide seconds in table',
    description: 'Whether to hide seconds in the time fields displayed in the table',
    type: 'boolean',
    defaultValue: booleanFromLocalStorage(CuesheetKeys.Seconds, false),
  },
  {
    id: 'followSelected',
    title: 'Follow selected event',
    description: 'Whether the view should automatically scroll to the selected event',
    type: 'boolean',
    defaultValue: booleanFromLocalStorage(CuesheetKeys.Follow, false),
  },
  {
    id: 'hidePast',
    title: 'Hide Past Events',
    description: 'Whether to hide events that have passed',
    type: 'boolean',
    defaultValue: booleanFromLocalStorage(CuesheetKeys.PreviousVisibility, true),
  },
  {
    id: 'showIndexColumn',
    title: 'Show index column',
    description: 'Whether the event indexes should be shown',
    type: 'boolean',
    defaultValue: booleanFromLocalStorage(CuesheetKeys.ColumnIndex, true),
  },
  { section: 'Delay flow' },
  {
    id: 'showDelayTimes',
    title: 'Show delays',
    description: 'Whether the time fields should include delays',
    type: 'boolean',
    defaultValue: booleanFromLocalStorage(CuesheetKeys.DelayedTimes, false),
  },
  {
    id: 'showDelays',
    title: 'Show delay blocks',
    description: 'Whether to show the delay blocks as rows',
    type: 'boolean',
    defaultValue: booleanFromLocalStorage(CuesheetKeys.DelayVisibility, true),
  },
];

/**
 * Utility extract the view options from URL Params
 * the names and fallbacks are manually matched with cuesheetOptions
 */
export function getOptionsFromParams(searchParams: URLSearchParams): CuesheetOptions {
  // we manually make an object that matches the key above
  return {
    hideTableSeconds: isStringBoolean(searchParams.get('hideTableSeconds'), false),
    followSelected: isStringBoolean(searchParams.get('followSelected'), false),
    hidePast: isStringBoolean(searchParams.get('hidePast'), true),
    showIndexColumn: isStringBoolean(searchParams.get('showIndexColumn'), true),
    showDelayTimes: isStringBoolean(searchParams.get('showDelayTimes'), false),
    showDelays: isStringBoolean(searchParams.get('showDelays'), true),
  };
}

/**
 * Called on submit of the view params form, will persist the params to the local storage
 * @param searchParams
 */
export function persistParams(searchParams: URLSearchParams) {
  const options = getOptionsFromParams(searchParams);

  // we manually make an object that matches the key above
  localStorage.setItem(CuesheetKeys.Seconds, String(options.hideTableSeconds));
  localStorage.setItem(CuesheetKeys.Follow, String(options.followSelected));
  localStorage.setItem(CuesheetKeys.PreviousVisibility, String(options.hidePast));
  localStorage.setItem(CuesheetKeys.ColumnIndex, String(options.showIndexColumn));
  localStorage.setItem(CuesheetKeys.DelayedTimes, String(options.showDelayTimes));
  localStorage.setItem(CuesheetKeys.DelayVisibility, String(options.showDelays));
}

interface CuesheetOptions {
  hideTableSeconds: boolean;
  followSelected: boolean;
  hidePast: boolean;
  showIndexColumn: boolean;
  showDelayTimes: boolean;
  showDelays: boolean;
}

/**
 * Hook exposes the cuesheet view options
 */
export function useCuesheetOptions(): CuesheetOptions {
  const [searchParams] = useSearchParams();
  const options = useMemo(() => getOptionsFromParams(searchParams), [searchParams]);
  return options;
}
