import {
  type CustomFields,
  defaultTeleprompterSpeed,
  type TeleprompterMode,
  type TeleprompterSettings,
} from 'ontime-types';
import { teleprompterSpeed } from 'ontime-utils';
import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { OptionTitle } from '../../common/components/view-params-editor/constants';
import type { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import { PresetContext } from '../../common/context/PresetContext';
import { getScriptSourceLabel, makeScriptSourceOptions } from '../../common/utils/teleprompterScriptSource';
import { isStringBoolean } from '../common/viewUtils';
import PlaybackOptions from './playback-options/PlaybackOptions';

/** Whose playback a view shows: its own, or the one the controllers and Companion drive */
export type TeleprompterRole = 'local' | 'remote' | 'controller';

/** A view which reads the field set in the project settings, as the shared playback does */
export const projectSource = 'project';

/**
 * How a view shows the script
 * Where its lines break is set once, in the project settings, for every view
 */
export type TeleprompterOptions = {
  role: TeleprompterRole;
  /** the field a local view reads, or the project's field */
  source: string;
  /** a local view which shows only the loaded event */
  onlyLoaded: boolean;
  lineHeight: number;
  textWidth: number;
  hideReadingLine: boolean;
  hideHeadings: boolean;
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
  source: projectSource,
  onlyLoaded: false,
  lineHeight: 1.3,
  textWidth: 80,
  hideReadingLine: false,
  hideHeadings: false,
  readingLinePos: 25,
  flipH: false,
  flipV: false,
  mode: 'event',
  speed: defaultTeleprompterSpeed,
};

const bounds = {
  lineHeight: [1, 4],
  textWidth: [20, 100],
  readingLinePos: [0, 90],
  speed: [teleprompterSpeed.min, teleprompterSpeed.max],
} as const;

const roles = ['local', 'controller', 'remote'] as const;

export const modeLabels: Record<TeleprompterMode, string> = {
  event: 'Event by event',
  script: 'Whole script',
};

const modes = (['event', 'script'] as const).map((value) => ({ value, label: modeLabels[value] }));

const resetOnReload = 'Changes while playing reset on reload.';

/**
 * The view options, which only change how a view shows the script
 * The playback role comes first, as it decides which of the options that follow apply
 */
export function getTeleprompterOptions(customFields: CustomFields, shared: TeleprompterSettings): ViewOption[] {
  const projectField = getScriptSourceLabel(shared.script, customFields);

  return [
    {
      title: OptionTitle.Playback,
      component: PlaybackOptions,
      // the role, then the options which only a view playing on its own reads
      options: [
        {
          id: 'role',
          title: 'Role',
          description: '',
          type: 'option',
          values: roles.map((value) => ({ value, label: value })),
          defaultValue: defaults.role,
        },
        {
          id: 'source',
          title: 'Script field',
          description: 'The field this screen reads its script from.',
          type: 'option',
          values: [
            { value: projectSource, label: `Same as the project (${projectField})` },
            ...makeScriptSourceOptions(customFields),
          ],
          defaultValue: defaults.source,
        },
        {
          id: 'mode',
          title: 'Starting mode',
          description: `Follow the loaded event or read continuously. ${resetOnReload}`,
          type: 'option',
          values: modes,
          defaultValue: defaults.mode,
        },
        {
          id: 'speed',
          title: 'Starting speed',
          description: `Lines per minute, ${bounds.speed[0]}–${bounds.speed[1]}. ${resetOnReload}`,
          type: 'number',
          defaultValue: defaults.speed,
        },
        {
          id: 'onlyLoaded',
          title: 'Show only the loaded event',
          description: 'Other events stay hidden, including when navigating playback.',
          type: 'boolean',
          defaultValue: defaults.onlyLoaded,
        },
      ],
    },
    {
      title: OptionTitle.ElementVisibility,
      collapsible: true,
      options: [
        {
          id: 'hideHeadings',
          title: 'Hide event headings',
          description: 'Hide heading text while keeping its spacing.',
          type: 'boolean',
          defaultValue: defaults.hideHeadings,
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
          description: `Width as a percentage of the screen, ${bounds.textWidth[0]}–${bounds.textWidth[1]}.`,
          type: 'number',
          defaultValue: defaults.textWidth,
        },
        {
          id: 'lineHeight',
          title: 'Line spacing',
          description: `Spacing as a multiple of text size, ${bounds.lineHeight[0]}–${bounds.lineHeight[1]}.`,
          type: 'number',
          defaultValue: defaults.lineHeight,
        },
        {
          id: 'hideReadingLine',
          title: 'Hide reading marker',
          description: 'Hide the reading marker.',
          type: 'boolean',
          defaultValue: defaults.hideReadingLine,
        },
        {
          id: 'readingLinePos',
          title: 'Reading position',
          description: `Position from the top of the screen, ${bounds.readingLinePos[0]}–${bounds.readingLinePos[1]}%.`,
          type: 'number',
          defaultValue: defaults.readingLinePos,
        },
        {
          id: 'flipH',
          title: 'Mirror horizontally',
          description: 'For reflected teleprompter displays.',
          type: 'boolean',
          defaultValue: defaults.flipH,
        },
        {
          id: 'flipV',
          title: 'Mirror vertically',
          description: 'Flip Screen in the navigation menu mirrors both ways and combines with these settings.',
          type: 'boolean',
          defaultValue: defaults.flipV,
        },
      ],
    },
  ];
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

  const role = roles.find((value) => value === getParam('role')) ?? defaults.role;

  return {
    role,
    source: getParam('source') || defaults.source,
    // a shared screen cannot keep its place in an event it does not show, so it shows them all
    onlyLoaded: role === 'local' && toBoolean(getParam('onlyLoaded'), defaults.onlyLoaded),
    lineHeight: toNumber(getParam('lineHeight'), bounds.lineHeight, defaults.lineHeight),
    textWidth: toNumber(getParam('textWidth'), bounds.textWidth, defaults.textWidth),
    hideReadingLine: toBoolean(getParam('hideReadingLine'), defaults.hideReadingLine),
    hideHeadings: toBoolean(getParam('hideHeadings'), defaults.hideHeadings),
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
