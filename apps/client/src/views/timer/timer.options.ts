import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { CustomFields, OntimeEvent, TimerType } from 'ontime-types';
import { validateTimerType } from 'ontime-utils';

import {
  getTimeOption,
  hideTimerSeconds,
  showLeadingZeros,
} from '../../common/components/view-params-editor/common.options';
import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import { makeOptionsFromCustomFields } from '../../common/components/view-params-editor/viewParams.utils';
import { isStringBoolean } from '../../features/viewers/common/viewUtils';

// manually match the properties of TimerType excluding the None
const timerDisplayOptions = {
  'no-overrides': 'No Overrides',
  'count-up': 'Count up',
  'count-down': 'Count down',
  clock: 'Clock',
};

export const getTimerOptions = (timeFormat: string, customFields: CustomFields): ViewOption[] => {
  const mainOptions = makeOptionsFromCustomFields(customFields, { title: 'Title', note: 'Note' });
  const secondaryOptions = makeOptionsFromCustomFields(customFields, { title: 'Title', note: 'Note' });

  return [
    { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
    {
      title: OptionTitle.TimerOptions,
      collapsible: true,
      options: [
        hideTimerSeconds,
        showLeadingZeros,
        {
          id: 'timerType',
          title: 'Timer type',
          description: 'Override the timer type',
          type: 'option',
          values: timerDisplayOptions,
          defaultValue: 'no-overrides',
        },
      ],
    },
    {
      title: OptionTitle.DataSources,
      collapsible: true,
      options: [
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
      ],
    },

    {
      title: OptionTitle.ElementVisibility,
      collapsible: true,
      options: [
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
          id: 'hideSecondary',
          title: 'Hide Auxiliary timer / Secondary message',
          description: 'Prevents the screen from displaying the secondary timer field',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
  ];
};

type TimerOptions = {
  hideClock: boolean;
  hideCards: boolean;
  hideProgress: boolean;
  hideMessage: boolean;
  hideSecondary: boolean;
  hideTimerSeconds: boolean;
  removeLeadingZeros: boolean;
  mainSource: keyof OntimeEvent | null;
  secondarySource: keyof OntimeEvent | null;
  timerType?: TimerType;
};

/**
 * Utility extract the view options from URL Params
 * the names and fallbacks are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams): TimerOptions {
  const timerType = validateTimerType(searchParams.get('timerType'), TimerType.None);
  // we manually make an object that matches the key above
  return {
    hideClock: isStringBoolean(searchParams.get('hideClock')),
    hideCards: isStringBoolean(searchParams.get('hideCards')),
    hideProgress: isStringBoolean(searchParams.get('hideProgress')),
    hideMessage: isStringBoolean(searchParams.get('hideMessage')),
    hideSecondary: isStringBoolean(searchParams.get('hideSecondary')),
    hideTimerSeconds: isStringBoolean(searchParams.get('hideTimerSeconds')),
    removeLeadingZeros: !isStringBoolean(searchParams.get('showLeadingZeros')),

    mainSource: searchParams.get('main') as keyof OntimeEvent | null,
    secondarySource: searchParams.get('secondary-src') as keyof OntimeEvent | null,

    // none doesnt make sense as a configuration of the view
    timerType: timerType === TimerType.None ? undefined : timerType,
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
