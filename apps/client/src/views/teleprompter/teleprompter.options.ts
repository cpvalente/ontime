import type { CustomFields } from 'ontime-types';
import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { OptionTitle } from '../../common/components/view-params-editor/constants';
import type { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import { makeOptionsFromCustomFields } from '../../common/components/view-params-editor/viewParams.utils';
import { PresetContext } from '../../common/context/PresetContext';
import { isStringBoolean } from '../common/viewUtils';
import { DEFAULT_SPEED, MAX_FONT_SIZE, MAX_SPEED, MIN_FONT_SIZE, MIN_SPEED } from './teleprompter.scroll';
import type { HeadingSource, TeleprompterOptions } from './teleprompter.types';

const headingOptions: { value: HeadingSource; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'cue', label: 'Cue' },
  { value: 'both', label: 'Cue and title' },
  { value: 'none', label: 'None' },
];
const headingSources = headingOptions.map((option) => option.value);

export const defaults = {
  script: 'none',
  heading: 'title' as HeadingSource,
  hideEmpty: true,
  showGroups: true,
  speed: DEFAULT_SPEED,
  followLoaded: true,
  fontSize: 52,
  lineHeight: 1.3,
  textWidth: 80,
  readingLine: true,
  readingLinePos: 25,
  flipH: false,
  flipV: false,
};

const bounds = {
  speed: [MIN_SPEED, MAX_SPEED],
  fontSize: [MIN_FONT_SIZE, MAX_FONT_SIZE],
  lineHeight: [1, 4],
  textWidth: [20, 100],
  readingLinePos: [0, 100],
} as const;

export const getTeleprompterOptions = (customFields: CustomFields): ViewOption[] => {
  const scriptOptions = makeOptionsFromCustomFields(customFields, [
    { value: 'none', label: 'None' },
    { value: 'note', label: 'Note' },
    { value: 'title', label: 'Title' },
  ]);

  return [
    {
      title: OptionTitle.DataSources,
      collapsible: true,
      options: [
        {
          id: 'script',
          title: 'Script',
          description: 'Select the data source which holds the script to read',
          type: 'option',
          values: scriptOptions,
          defaultValue: defaults.script,
        },
        {
          id: 'heading',
          title: 'Segment heading',
          description: 'What to show above each segment of the script',
          type: 'option',
          values: headingOptions,
          defaultValue: defaults.heading,
        },
      ],
    },
    {
      title: OptionTitle.BehaviourOptions,
      collapsible: true,
      options: [
        {
          id: 'speed',
          title: 'Speed',
          description: `Scroll speed in lines per minute (${MIN_SPEED}-${MAX_SPEED}). Adjustable live with the arrow keys`,
          type: 'number',
          defaultValue: defaults.speed,
        },
        {
          id: 'followLoaded',
          title: 'Follow loaded event',
          description: 'Scroll to the segment of the loaded event. Scrolling by hand releases the follow',
          type: 'boolean',
          defaultValue: defaults.followLoaded,
        },
      ],
    },
    {
      title: OptionTitle.ElementVisibility,
      collapsible: true,
      options: [
        {
          id: 'hideEmpty',
          title: 'Hide events without a script',
          description: 'Prevents showing headings for events which have no script text',
          type: 'boolean',
          defaultValue: defaults.hideEmpty,
        },
        {
          id: 'showGroups',
          title: 'Show group names',
          description: 'Shows the group name when the script moves into a new group',
          type: 'boolean',
          defaultValue: defaults.showGroups,
        },
      ],
    },
    {
      title: OptionTitle.StyleOverride,
      collapsible: true,
      options: [
        {
          id: 'fontSize',
          title: 'Font size',
          description: 'Base font size in pixels. Adjustable live with the + and - keys',
          type: 'number',
          defaultValue: defaults.fontSize,
        },
        {
          id: 'lineHeight',
          title: 'Line height',
          description: 'Spacing between lines, as a multiple of the font size',
          type: 'number',
          defaultValue: defaults.lineHeight,
        },
        {
          id: 'textWidth',
          title: 'Text width',
          description: 'Width of the text column as a percentage of the screen. Narrower means less eye movement',
          type: 'number',
          defaultValue: defaults.textWidth,
        },
        {
          id: 'readingLine',
          title: 'Reading line',
          description: 'Shows a marker beside the line which should be read',
          type: 'boolean',
          defaultValue: defaults.readingLine,
        },
        {
          id: 'readingLinePos',
          title: 'Reading line position',
          description: 'Position of the reading line as a percentage from the top of the screen',
          type: 'number',
          defaultValue: defaults.readingLinePos,
        },
        {
          id: 'flipH',
          title: 'Flip horizontally',
          description:
            'Mirrors the view horizontally, which is what a beam splitter rig needs. Toggled live with F. Flip Screen in the navigation menu flips both axes at once, which is a rotation rather than a mirror',
          type: 'boolean',
          defaultValue: defaults.flipH,
        },
        {
          id: 'flipV',
          title: 'Flip vertically',
          description: 'Mirrors the view vertically. Note this also moves the reading line. Toggled live with Shift+F',
          type: 'boolean',
          defaultValue: defaults.flipV,
        },
      ],
    },
  ];
};

function toNumber(value: string | null, [min, max]: readonly [number, number], fallback: number): number {
  if (value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function toBoolean(value: string | null, fallback: boolean): boolean {
  return value === null ? fallback : isStringBoolean(value);
}

function toEnum<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function getOptionsFromParams(
  searchParams: URLSearchParams,
  defaultValues?: URLSearchParams,
): TeleprompterOptions {
  const getValue = (key: string) => defaultValues?.get(key) ?? searchParams.get(key);

  return {
    scriptSource: getValue('script') ?? defaults.script,
    heading: toEnum(getValue('heading'), headingSources, defaults.heading),

    hideEmpty: toBoolean(getValue('hideEmpty'), defaults.hideEmpty),
    showGroups: toBoolean(getValue('showGroups'), defaults.showGroups),

    speed: toNumber(getValue('speed'), bounds.speed, defaults.speed),
    followLoaded: toBoolean(getValue('followLoaded'), defaults.followLoaded),

    fontSize: toNumber(getValue('fontSize'), bounds.fontSize, defaults.fontSize),
    lineHeight: toNumber(getValue('lineHeight'), bounds.lineHeight, defaults.lineHeight),
    textWidth: toNumber(getValue('textWidth'), bounds.textWidth, defaults.textWidth),
    readingLine: toBoolean(getValue('readingLine'), defaults.readingLine),
    readingLinePos: toNumber(getValue('readingLinePos'), bounds.readingLinePos, defaults.readingLinePos),
    flipH: toBoolean(getValue('flipH'), defaults.flipH),
    flipV: toBoolean(getValue('flipV'), defaults.flipV),
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
