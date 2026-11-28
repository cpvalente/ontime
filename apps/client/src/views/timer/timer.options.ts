import { CustomFields, OntimeEvent, TimerType } from 'ontime-types';
import { validateTimerType } from 'ontime-utils';
import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import type { SelectOption } from '../../common/components/select/Select';
import {
  getTimeOption,
  hideTimerSeconds,
  showLeadingZeros,
  TimeOptions,
} from '../../common/components/view-params-editor/common.options';
import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import {
  makeOptionsFromCustomFields,
  makeViewParamsReader,
} from '../../common/components/view-params-editor/viewParams.utils';
import { PresetContext } from '../../common/context/PresetContext';
import { isStringBoolean, makeColourString } from '../common/viewUtils';
import { endSoundOptions, isEndSound, type EndSound } from './timer.sound';

// manually match the properties of TimerType excluding the None
const timerDisplayOptions: SelectOption[] = [
  { value: 'no-overrides', label: 'No overrides' },
  { value: TimerType.CountUp, label: 'Count up' },
  { value: TimerType.CountDown, label: 'Count down' },
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
    { value: 'parent', label: 'Group title' },
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
          description: 'Overrides the timer type of the event',
          type: 'option',
          values: timerDisplayOptions,
          defaultValue: 'no-overrides',
        },
        {
          id: 'freezeOvertime',
          title: 'Freeze overtime',
          description: 'The timer does not count into negative numbers',
          type: 'boolean',
          defaultValue: false,
        },
        {
          id: 'freezeMessage',
          title: 'Freeze message',
          description: 'Shown when the timer is in overtime, requires freeze overtime',
          type: 'string',
          defaultValue: '',
          placeholder: 'e.g. Time is up!',
        },
        {
          id: 'hidePhase',
          title: 'Hide progress styles',
          description: 'Suppresses the warning, danger and overtime styles',
          type: 'boolean',
          defaultValue: false,
        },
        {
          id: 'endSound',
          title: 'Play sound on timer end',
          description: 'Plays when the timer reaches zero, the screen must be interacted with once before it can play',
          type: 'option',
          values: endSoundOptions,
          defaultValue: 'none',
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
          type: 'option',
          values: mainOptions,
          defaultValue: 'title',
        },
        {
          id: 'secondary-src',
          title: 'Secondary text',
          description: 'Shown in the now and next cards',
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
          title: 'Hide time now',
          type: 'boolean',
          defaultValue: false,
        },
        {
          id: 'hideCards',
          title: 'Hide cards',
          description: 'Hides the now and next cards',
          type: 'boolean',
          defaultValue: false,
        },
        {
          id: 'hideProgress',
          title: 'Hide progress bar',
          type: 'boolean',
          defaultValue: false,
        },
        {
          id: 'hideMessage',
          title: 'Hide timer message',
          description: 'Hides fullscreen messages sent to the timer',
          type: 'boolean',
          defaultValue: false,
        },
        {
          id: 'hideSecondary',
          title: 'Hide auxiliary timer / secondary message',
          description: 'Hides the secondary timer field',
          type: 'boolean',
          defaultValue: false,
        },
        {
          id: 'hideLogo',
          title: 'Hide the project logo',
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
          description: 'Font family, uses the fonts available in the system',
          type: 'string',
          placeholder: 'Open Sans (default)',
        },
        {
          id: 'keyColour',
          title: 'Key colour',
          description: 'Background or key colour for the entire view',
          type: 'colour',
          defaultValue: '101010',
        },
        {
          id: 'timerColour',
          title: 'Timer colour',
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
  endSound: EndSound;
  font?: string;
  keyColour?: string;
  timerColour?: string;
} & TimeOptions;

/**
 * Utility extract the view options from URL Params
 * the names and fallbacks are manually matched with timerOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams, defaultValues?: URLSearchParams): TimerOptions {
  const params = makeViewParamsReader(searchParams, defaultValues);

  // Get timerType from either source
  const timerType = validateTimerType(params.get('timerType'), TimerType.None);
  const endSoundValue = params.get('endSound');

  return {
    hideClock: isStringBoolean(params.get('hideClock')),
    hideCards: isStringBoolean(params.get('hideCards')),
    hideProgress: isStringBoolean(params.get('hideProgress')),
    hideMessage: isStringBoolean(params.get('hideMessage')),
    hideSecondary: isStringBoolean(params.get('hideSecondary')),
    hideLogo: isStringBoolean(params.get('hideLogo')),
    hideTimerSeconds: isStringBoolean(params.get('hideTimerSeconds')),
    removeLeadingZeros: !isStringBoolean(params.get('showLeadingZeros')),

    mainSource: params.get('main') as keyof OntimeEvent | null,
    secondarySource: params.get('secondary-src') as keyof OntimeEvent | null,

    // none doesnt make sense as a configuration of the view
    timerType: timerType === TimerType.None ? undefined : timerType,
    freezeOvertime: isStringBoolean(params.get('freezeOvertime')),
    freezeMessage: params.get('freezeMessage') ?? '',
    hidePhase: isStringBoolean(params.get('hidePhase')),
    endSound: isEndSound(endSoundValue) ? endSoundValue : 'none',

    font: params.get('font') ?? undefined,
    keyColour: makeColourString(params.get('keyColour')),
    timerColour: makeColourString(params.get('timerColour')),
    timeformat: params.get('timeformat'),
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
