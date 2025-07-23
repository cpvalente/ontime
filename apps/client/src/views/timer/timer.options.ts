import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { CustomFields, OntimeEvent, TimerType } from 'ontime-types';
import { validateTimerType } from 'ontime-utils';

import type { SelectOption } from '../../common/components/select/Select';
import {
  getTimeOption,
  hideTimerSeconds,
  showLeadingZeros,
} from '../../common/components/view-params-editor/common.options';
import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import { makeOptionsFromCustomFields } from '../../common/components/view-params-editor/viewParams.utils';
import { isStringBoolean, makeColourString } from '../../features/viewers/common/viewUtils';

// manually match the properties of TimerType excluding the None
const timerDisplayOptions: SelectOption[] = [
  { value: 'no-overrides', label: 'No Overrides' },
  { value: TimerType.CountUp, label: 'Count Up' },
  { value: TimerType.CountDown, label: 'Count Down' },
  { value: TimerType.Clock, label: 'Clock' },
];

export const getTimerOptions = (timeFormat: string, customFields: CustomFields): ViewOption[] => {
  const mainOptions = makeOptionsFromCustomFields(customFields, [
    { value: 'title', label: 'Title' },
    { value: 'note', label: 'Note' },
  ]);
  const secondaryOptions = makeOptionsFromCustomFields(customFields, [
    { value: 'title', label: 'Title' },
    { value: 'note', label: 'Note' },
  ]);

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
        {
          id: 'freezeOvertime',
          title: 'Freeze Overtime',
          description: 'If active, the timer will not count into negative numbers',
          type: 'boolean',
          defaultValue: false,
        },
        {
          id: 'freezeMessage',
          title: 'Freeze Message',
          description:
            'An optional message to show when the timer is in overtime (must be set in combination with Freeze Overtime)',
          type: 'string',
          defaultValue: '',
          placeholder: 'e.g. Time is up!',
        },
        {
          id: 'hidePhase',
          title: 'Hide progress styles',
          description: 'Whether to suppress the progress styles (warning, danger and overtime)',
          type: 'boolean',
          defaultValue: false,
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
        {
          id: 'hideLogo',
          title: 'Hide the project logo',
          description: 'Prevents the screen from displaying the given project logo',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
    {
      title: OptionTitle.StyleOverride,
      collapsible: true,
      options: [
        {
          id: 'font',
          title: 'Font',
          description: 'Font family, will use the fonts available in the system',
          type: 'string',
          placeholder: 'Open Sans (default)',
        },
        {
          id: 'keyColour',
          title: 'Key Colour',
          description: 'Background or key colour for entire view. Default: #101010',
          type: 'colour',
          defaultValue: '101010',
        },
        {
          id: 'textColour',
          title: 'Text Colour',
          description: 'Text colour. Default: #f6f6f6',
          type: 'colour',
          defaultValue: 'f6f6f6',
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
  hideLogo: boolean;
  hideTimerSeconds: boolean;
  removeLeadingZeros: boolean;
  mainSource: keyof OntimeEvent | null;
  secondarySource: keyof OntimeEvent | null;
  timerType?: TimerType;
  freezeOvertime: boolean;
  freezeMessage: string;
  hidePhase: boolean;
  font?: string;
  keyColour?: string;
  textColour?: string;
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
    hideLogo: isStringBoolean(searchParams.get('hideLogo')),
    hideTimerSeconds: isStringBoolean(searchParams.get('hideTimerSeconds')),
    removeLeadingZeros: !isStringBoolean(searchParams.get('showLeadingZeros')),

    mainSource: searchParams.get('main') as keyof OntimeEvent | null,
    secondarySource: searchParams.get('secondary-src') as keyof OntimeEvent | null,

    // none doesnt make sense as a configuration of the view
    timerType: timerType === TimerType.None ? undefined : timerType,
    freezeOvertime: isStringBoolean(searchParams.get('freezeOvertime')),
    freezeMessage: searchParams.get('freezeMessage') ?? '',
    hidePhase: isStringBoolean(searchParams.get('hidePhase')),

    font: searchParams.get('font') ?? undefined,
    keyColour: makeColourString(searchParams.get('keyColour')),
    textColour: makeColourString(searchParams.get('textColour')),
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
