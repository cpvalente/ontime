import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomFields, OntimeEvent } from 'ontime-types';

import {
  getTimeOption,
  hideTimerSeconds,
  makeOptionsFromCustomFields,
  showLeadingZeros,
} from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/types';
import { isStringBoolean } from '../../features/viewers/common/viewUtils';

export const getTimerOptions = (timeFormat: string, customFields: CustomFields): ViewOption[] => {
  const mainOptions = makeOptionsFromCustomFields(customFields, { title: 'Title', note: 'Note' });
  const secondaryOptions = makeOptionsFromCustomFields(customFields, { title: 'Title', note: 'Note' });

  return [
    { section: 'Clock Options' },
    getTimeOption(timeFormat),
    { section: 'Timer Options' },
    hideTimerSeconds,
    showLeadingZeros,
    { section: 'Data sources' },
    {
      id: 'main',
      title: 'Main text',
      description: 'Select the data source for the main text',
      type: 'option',
      values: mainOptions,
      defaultValue: 'Title',
    },
    {
      id: 'secondary-src',
      title: 'Secondary text',
      description: 'Select the data source for the secondary text',
      type: 'option',
      values: secondaryOptions,
      defaultValue: '',
    },
    { section: 'Element visibility' },
    {
      id: 'hideClock',
      title: 'Hide Time Now',
      description: 'Hides the Time Now field',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'hideCards',
      title: 'Hide Cards',
      description: 'Hides the Now and Next cards',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'hideProgress',
      title: 'Hide progress bar',
      description: 'Hides the progress bar',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'hideMessage',
      title: 'Hide Timer Message',
      description: 'Prevents displaying fullscreen messages in the timer',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'hideExternal',
      title: 'Hide Auxiliary timer / External message',
      description: 'Prevents the screen from displaying the secondary timer field',
      type: 'boolean',
      defaultValue: false,
    },
  ];
};

type TimerOptions = {
  hideClock: boolean;
  hideCards: boolean;
  hideProgress: boolean;
  hideMessage: boolean;
  hideExternal: boolean;
  hideTimerSeconds: boolean;
  removeLeadingZeros: boolean;
  mainSource: keyof OntimeEvent | null;
  secondarySource: keyof OntimeEvent | null;
};

/**
 * Utility extract the view options from URL Params
 * the names and fallbacks are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams): TimerOptions {
  // we manually make an object that matches the key above
  return {
    hideClock: isStringBoolean(searchParams.get('hideClock')),
    hideCards: isStringBoolean(searchParams.get('hideCards')),
    hideProgress: isStringBoolean(searchParams.get('hideProgress')),
    hideMessage: isStringBoolean(searchParams.get('hideMessage')),
    hideExternal: isStringBoolean(searchParams.get('hideExternal')),
    hideTimerSeconds: isStringBoolean(searchParams.get('hideTimerSeconds')),
    removeLeadingZeros: !isStringBoolean(searchParams.get('showLeadingZeros')),

    mainSource: searchParams.get('main') as keyof OntimeEvent | null,
    secondarySource: searchParams.get('secondary-src') as keyof OntimeEvent | null,
  };
}

/**
 * Hook exposes the timer view options
 */
export function useTimerOptions(): TimerOptions {
  const [searchParams] = useSearchParams();
  const options = useMemo(() => getOptionsFromParams(searchParams), [searchParams]);
  return options;
}
