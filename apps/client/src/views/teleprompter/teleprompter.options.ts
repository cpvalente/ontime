import {
  defaultTeleprompterSpeed,
  type CustomFields,
  type TeleprompterMode,
  type TeleprompterSettings,
} from 'ontime-types';
import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { OptionTitle } from '../../common/components/view-params-editor/constants';
import type { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import { makeViewParamsReader } from '../../common/components/view-params-editor/viewParams.utils';
import { PresetContext } from '../../common/context/PresetContext';
import { getScriptSourceLabel, makeScriptSourceOptions } from '../../common/utils/teleprompterScriptSource';
import { isStringBoolean } from '../common/viewUtils';
import PlaybackOptions from './playback-options/PlaybackOptions';

export type TeleprompterRole = 'local' | 'remote' | 'controller';

export const projectSource = 'project';

export type TeleprompterOptions = {
  role: TeleprompterRole;
  source: string;
  onlyLoaded: boolean;
  lineHeight: number;
  textWidth: number;
  hideReadingLine: boolean;
  hideHeadings: boolean;
  readingLinePos: number;
  flipH: boolean;
  flipV: boolean;
  mode: TeleprompterMode;
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
  speed: [1, 100],
} as const;

const roles = ['local', 'controller', 'remote'] as const;

const roleLabels: Record<TeleprompterRole, string> = {
  local: 'Independent',
  controller: 'Controller',
  remote: 'Follower',
};

export const modeLabels: Record<TeleprompterMode, string> = {
  event: 'Event by event',
  script: 'Whole script',
};

const modes = (['event', 'script'] as const).map((value) => ({ value, label: modeLabels[value] }));

const resetOnReload = 'changes while playing reset on reload';

export function getTeleprompterOptions(customFields: CustomFields, shared: TeleprompterSettings): ViewOption[] {
  const projectField = getScriptSourceLabel(shared.script, customFields);

  return [
    {
      title: OptionTitle.Playback,
      component: PlaybackOptions,
      options: [
        {
          id: 'role',
          title: 'Role',
          description: 'How this screen shares playback with other screens',
          type: 'option',
          values: roles.map((value) => ({ value, label: roleLabels[value] })),
          defaultValue: defaults.role,
        },
        {
          id: 'source',
          title: 'Script field',
          description: 'The field this screen reads its script from',
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
          description: `Follow the loaded event or read continuously, ${resetOnReload}`,
          type: 'option',
          values: modes,
          defaultValue: defaults.mode,
        },
        {
          id: 'speed',
          title: 'Starting speed',
          description: `Lines per minute, ${bounds.speed[0]}-${bounds.speed[1]}, ${resetOnReload}`,
          type: 'number',
          defaultValue: defaults.speed,
        },
        {
          id: 'onlyLoaded',
          title: 'Show only the loaded event',
          description: 'Other events stay hidden, including when navigating playback',
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
          description: 'Hides heading text while keeping its spacing',
          type: 'boolean',
          defaultValue: defaults.hideHeadings,
        },
      ],
    },
    {
      title: OptionTitle.ReadingLayout,
      collapsible: true,
      options: [
        {
          id: 'textWidth',
          title: 'Text width',
          description: `Width as a percentage of the screen, ${bounds.textWidth[0]}-${bounds.textWidth[1]}`,
          type: 'number',
          defaultValue: defaults.textWidth,
        },
        {
          id: 'lineHeight',
          title: 'Line spacing',
          description: `Spacing as a multiple of text size, ${bounds.lineHeight[0]}-${bounds.lineHeight[1]}`,
          type: 'number',
          defaultValue: defaults.lineHeight,
        },
        {
          id: 'hideReadingLine',
          title: 'Hide reading marker',
          type: 'boolean',
          defaultValue: defaults.hideReadingLine,
        },
        {
          id: 'readingLinePos',
          title: 'Reading position',
          description: `Position from the top of the screen, ${bounds.readingLinePos[0]}-${bounds.readingLinePos[1]}%`,
          type: 'number',
          defaultValue: defaults.readingLinePos,
        },
        {
          id: 'flipH',
          title: 'Mirror horizontally',
          description: 'For reflected teleprompter displays',
          type: 'boolean',
          defaultValue: defaults.flipH,
        },
        {
          id: 'flipV',
          title: 'Mirror vertically',
          description: 'Flip Screen in the navigation menu mirrors both ways and combines with these settings',
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
  const params = makeViewParamsReader(searchParams, defaultValues);

  const role = roles.find((value) => value === params.get('role')) ?? defaults.role;

  return {
    role,
    source: params.get('source') || defaults.source,
    onlyLoaded: role === 'local' && toBoolean(params.get('onlyLoaded'), defaults.onlyLoaded),
    lineHeight: toNumber(params.get('lineHeight'), bounds.lineHeight, defaults.lineHeight),
    textWidth: toNumber(params.get('textWidth'), bounds.textWidth, defaults.textWidth),
    hideReadingLine: toBoolean(params.get('hideReadingLine'), defaults.hideReadingLine),
    hideHeadings: toBoolean(params.get('hideHeadings'), defaults.hideHeadings),
    readingLinePos: toNumber(params.get('readingLinePos'), bounds.readingLinePos, defaults.readingLinePos),
    flipH: toBoolean(params.get('flipH'), defaults.flipH),
    flipV: toBoolean(params.get('flipV'), defaults.flipV),
    mode: modes.find(({ value }) => value === params.get('mode'))?.value ?? defaults.mode,
    speed: toNumber(params.get('speed'), bounds.speed, defaults.speed),
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
