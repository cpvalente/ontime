import {
  type CustomFields,
  defaultTeleprompterSpeed,
  type TeleprompterHeading,
  type TeleprompterMode,
  type TeleprompterSettings,
} from 'ontime-types';
import { teleprompterSpeed } from 'ontime-utils';
import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { OptionTitle } from '../../common/components/view-params-editor/constants';
import type { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import { PresetContext } from '../../common/context/PresetContext';
import { isStringBoolean } from '../common/viewUtils';

/** Whose playback a view shows: its own, or the one the controllers and Companion drive */
export type TeleprompterRole = 'local' | 'remote' | 'controller';

/**
 * How a view shows the script
 * What the script holds and where its lines break is set once, in the project settings, for every view
 */
export type TeleprompterOptions = {
  role: TeleprompterRole;
  onlyLoaded: boolean;
  lineHeight: number;
  textWidth: number;
  hideReadingLine: boolean;
  readingLinePos: number;
  flipH: boolean;
  flipV: boolean;
  /** a local view's starting mode */
  mode: TeleprompterMode;
  /** a local view's starting speed, in lines per minute */
  speed: number;
};

export const defaults: TeleprompterOptions = {
  role: 'local',
  onlyLoaded: false,
  lineHeight: 1.3,
  textWidth: 80,
  hideReadingLine: false,
  readingLinePos: 25,
  flipH: false,
  flipV: false,
  mode: 'event',
  speed: defaultTeleprompterSpeed,
};

const bounds = {
  lineHeight: [1, 4],
  textWidth: [20, 100],
  readingLinePos: [0, 100],
  speed: [teleprompterSpeed.min, teleprompterSpeed.max],
} as const;

export const roleLabels: Record<TeleprompterRole, string> = {
  local: 'This view only',
  controller: 'Controller',
  remote: 'Follows the controller',
};

const roles = (['local', 'controller', 'remote'] as const).map((value) => ({ value, label: roleLabels[value] }));

const headingLabels: Record<TeleprompterHeading, string> = {
  title: 'title',
  cue: 'cue',
  both: 'cue and title',
  none: 'no',
};

export const modeLabels: Record<TeleprompterMode, string> = {
  event: 'Event by event',
  script: 'Whole script',
};

const modes = (['event', 'script'] as const).map((value) => ({ value, label: modeLabels[value] }));

/** Only a view playing on its own has a transport of its own, which starts with its own mode and speed */
const ownPlaybackOnly = {
  id: 'role',
  values: ['local'],
  reason: 'Comes from the shared playback, which controllers and Companion change',
};

/** The view options, which only change how a view shows the script */
export function getTeleprompterOptions(customFields: CustomFields, shared: TeleprompterSettings): ViewOption[] {
  return [
    {
      title: OptionTitle.BehaviourOptions,
      options: [
        {
          id: 'role',
          title: 'Playback',
          description: `This view only plays on its own. A controller drives the shared playback, which views following it show. Every view reads the script set in the project settings: ${describeShared(shared, customFields)}`,
          type: 'option',
          values: roles,
          defaultValue: defaults.role,
        },
        {
          id: 'mode',
          title: 'Starting mode',
          description: `${modeLabels.event} stops at the end of each event and follows the event Ontime loads. ${modeLabels.script} reads on to the end. Switch it live with M or the on-screen controls`,
          type: 'option',
          values: modes,
          defaultValue: defaults.mode,
          enabledWhen: ownPlaybackOnly,
        },
        {
          id: 'speed',
          title: 'Starting speed',
          description: `Lines per minute, ${bounds.speed[0]} to ${bounds.speed[1]}. Change it live with the arrow keys or the on-screen controls`,
          type: 'number',
          defaultValue: defaults.speed,
          enabledWhen: ownPlaybackOnly,
        },
      ],
    },
    {
      title: OptionTitle.ElementVisibility,
      collapsible: true,
      options: [
        {
          id: 'onlyLoaded',
          title: 'Show only the loaded event',
          description:
            'Hides the events playback could otherwise move to. Until an event is loaded, the screen waits for one',
          type: 'boolean',
          defaultValue: defaults.onlyLoaded,
        },
      ],
    },
    {
      // a prompter is read from a fixed line, often through a glass, which no other view needs
      title: OptionTitle.ReadingLayout,
      collapsible: true,
      options: [
        {
          id: 'textWidth',
          title: 'Text width',
          description: `Percentage of the screen, ${bounds.textWidth[0]} to ${bounds.textWidth[1]}. The text grows until the longest line fills it`,
          type: 'number',
          defaultValue: defaults.textWidth,
        },
        {
          id: 'lineHeight',
          title: 'Line spacing',
          description: `Multiple of the text size, ${bounds.lineHeight[0]} to ${bounds.lineHeight[1]}`,
          type: 'number',
          defaultValue: defaults.lineHeight,
        },
        {
          id: 'hideReadingLine',
          title: 'Hide reading marker',
          description: 'Hides the marker on the line to read',
          type: 'boolean',
          defaultValue: defaults.hideReadingLine,
        },
        {
          id: 'readingLinePos',
          title: 'Reading position',
          description: `Percentage from the top of the screen, ${bounds.readingLinePos[0]} to ${bounds.readingLinePos[1]}, with or without the marker`,
          type: 'number',
          defaultValue: defaults.readingLinePos,
        },
        {
          id: 'flipH',
          title: 'Mirror horizontally',
          description: 'For teleprompter rigs which reflect the screen in a glass',
          type: 'boolean',
          defaultValue: defaults.flipH,
        },
        {
          id: 'flipV',
          title: 'Mirror vertically',
          description:
            'Moves the reading position to match. Flip Screen in the navigation menu mirrors both ways, turning the view upside down',
          type: 'boolean',
          defaultValue: defaults.flipV,
        },
      ],
    },
  ];
}

/** The project's script settings, in a line */
function describeShared(shared: TeleprompterSettings, customFields: CustomFields): string {
  const field = (() => {
    if (shared.script === 'note') return 'Note';
    if (shared.script === 'title') return 'Title';
    return customFields[shared.script.replace(/^custom-/, '')]?.label ?? shared.script;
  })();
  return [
    `${field} field`,
    `${headingLabels[shared.heading]} heading`,
    `${shared.charsPerLine} characters per line`,
  ].join(', ');
}

function toNumber(value: string | null, [min, max]: readonly [number, number], fallback: number): number {
  if (value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function toBoolean(value: string | null, fallback: boolean): boolean {
  return value === null ? fallback : isStringBoolean(value);
}

export function getOptionsFromParams(
  searchParams: URLSearchParams,
  defaultValues?: URLSearchParams,
): TeleprompterOptions {
  const getParam = (key: string) => defaultValues?.get(key) ?? searchParams.get(key);

  return {
    role: roles.find(({ value }) => value === getParam('role'))?.value ?? defaults.role,
    onlyLoaded: toBoolean(getParam('onlyLoaded'), defaults.onlyLoaded),
    lineHeight: toNumber(getParam('lineHeight'), bounds.lineHeight, defaults.lineHeight),
    textWidth: toNumber(getParam('textWidth'), bounds.textWidth, defaults.textWidth),
    hideReadingLine: toBoolean(getParam('hideReadingLine'), defaults.hideReadingLine),
    readingLinePos: toNumber(getParam('readingLinePos'), bounds.readingLinePos, defaults.readingLinePos),
    flipH: toBoolean(getParam('flipH'), defaults.flipH),
    flipV: toBoolean(getParam('flipV'), defaults.flipV),
    mode: modes.find(({ value }) => value === getParam('mode'))?.value ?? defaults.mode,
    speed: toNumber(getParam('speed'), bounds.speed, defaults.speed),
  };
}

export function useTeleprompterOptions(): TeleprompterOptions {
  const [searchParams] = useSearchParams();
  const maybePreset = use(PresetContext);

  return useMemo(() => {
    const defaultValues = maybePreset ? new URLSearchParams(maybePreset.search) : undefined;
    return getOptionsFromParams(searchParams, defaultValues);
  }, [maybePreset, searchParams]);
}
