import { use, useMemo } from 'react';
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
import { PresetContext } from '../../common/context/PresetContext';
import { isStringBoolean, makeColourString } from '../common/viewUtils';

// manually match the properties of TimerType excluding the None
const timerDisplayOptions: SelectOption[] = [
  { value: 'no-overrides', label: 'No Overrides' },
  { value: TimerType.CountUp, label: 'Count Up' },
  { value: TimerType.CountDown, label: 'Count Down' },
  { value: TimerType.Clock, label: 'Clock' },
];

export const getTimerOptions = (timeFormat: string, customFields: CustomFields): ViewOption[] => {
  const mainOptions = makeOptionsFromCustomFields(customFields, [
    { value: 'none', label: 'None' },
    { value: 'title', label: 'Title' },
  ]);
  const secondaryOptions = makeOptionsFromCustomFields(customFields, [
    { value: 'none', label: 'None' },
    { value: 'title', label: 'Title' },
    { value: 'note', label: 'Note' },
    { value: 'parent', label: 'Group Title' },
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
          defaultValue: 'title',
        },
        {
          id: 'secondary-src',
          title: 'Secondary text',
          description: 'Select the data source for the secondary text',
          type: 'option',
          values: secondaryOptions,
          defaultValue: 'none',
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
          id: 'timerColour',
          title: 'Timer Colour',
          description: 'Timer colour. Default: #f6f6f6',
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
  mainSource: keyof OntimeEvent | null | 'none';
  secondarySource: keyof OntimeEvent | null | 'none';
  timerType?: TimerType;
  freezeOvertime: boolean;
  freezeMessage: string;
  hidePhase: boolean;
  font?: string;
  keyColour?: string;
  timerColour?: string;
};

/**
 * Utility extract the view options from URL Params
 * the names and fallbacks are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams, defaultValues?: URLSearchParams): TimerOptions {
  // Helper to get value from either source, prioritizing defaultValues
  const getValue = (key: string) => defaultValues?.get(key) ?? searchParams.get(key);

  // Get timerType from either source
  const timerType = validateTimerType(getValue('timerType'), TimerType.None);

  return {
    hideClock: isStringBoolean(getValue('hideClock')),
    hideCards: isStringBoolean(getValue('hideCards')),
    hideProgress: isStringBoolean(getValue('hideProgress')),
    hideMessage: isStringBoolean(getValue('hideMessage')),
    hideSecondary: isStringBoolean(getValue('hideSecondary')),
    hideLogo: isStringBoolean(getValue('hideLogo')),
    hideTimerSeconds: isStringBoolean(getValue('hideTimerSeconds')),
    removeLeadingZeros: !isStringBoolean(getValue('showLeadingZeros')),

    mainSource: getValue('main') as keyof OntimeEvent | null,
    secondarySource: getValue('secondary-src') as keyof OntimeEvent | null,

    // none doesnt make sense as a configuration of the view
    timerType: timerType === TimerType.None ? undefined : timerType,
    freezeOvertime: isStringBoolean(getValue('freezeOvertime')),
    freezeMessage: getValue('freezeMessage') ?? '',
    hidePhase: isStringBoolean(getValue('hidePhase')),

    font: getValue('font') ?? undefined,
    keyColour: makeColourString(getValue('keyColour')),
    timerColour: makeColourString(getValue('timerColour')),
  };
}

/**
 * Hook exposes the timer view options
 */
export function useTimerOptions(): TimerOptions {
  const [searchParams] = useSearchParams();
  const maybePreset = use(PresetContext);

  const options = useMemo(() => {
    const defaultValues = maybePreset ? new URLSearchParams(maybePreset.search) : undefined;
    return getOptionsFromParams(searchParams, defaultValues);
  }, [maybePreset, searchParams]);

  return options;
}
