import type { CustomFields, TeleprompterHeading, TeleprompterSettings } from 'ontime-types';
import { teleprompterCharsPerLine, teleprompterSpeed } from 'ontime-utils';
import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { OptionTitle } from '../../common/components/view-params-editor/constants';
import type { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import { PresetContext } from '../../common/context/PresetContext';
import { isStringBoolean } from '../common/viewUtils';

export type TeleprompterOptions = {
  remoteControl: boolean;
  control: boolean;
  onlyPlaying: boolean;
  lineHeight: number;
  textWidth: number;
  readingLine: boolean;
  readingLinePos: number;
  flipH: boolean;
  flipV: boolean;
  /** a local view's own script settings, as the query for its script, empty for the shared ones */
  scriptSearch: string;
  /** a local view's own follow mode, or null to use the shared one */
  followLoaded: boolean | null;
  /** a local view's starting speed, in lines per minute */
  speed: number;
};

/** Options which shape a local view's script, which remote screens and controllers take from the project instead */
const localScriptParams = ['script', 'charsPerLine', 'heading', 'showGroups', 'hideEmpty'] as const;

export const defaults: TeleprompterOptions = {
  remoteControl: false,
  control: false,
  onlyPlaying: false,
  lineHeight: 1.3,
  textWidth: 80,
  readingLine: true,
  readingLinePos: 25,
  flipH: false,
  flipV: false,
  scriptSearch: '',
  followLoaded: null,
  speed: 14,
};

const bounds = {
  lineHeight: [1, 4],
  textWidth: [20, 100],
  readingLinePos: [0, 100],
  speed: [teleprompterSpeed.min, teleprompterSpeed.max],
} as const;

const headingOptions: { value: TeleprompterHeading; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'cue', label: 'Cue' },
  { value: 'both', label: 'Cue and title' },
  { value: 'none', label: 'None' },
];

const localNote = 'Local view only, remote screens and controllers use the project settings';

/**
 * The view options, where a local view's script settings default to the project's
 */
export function getTeleprompterOptions(customFields: CustomFields, shared: TeleprompterSettings): ViewOption[] {
  const scriptFields = [
    { value: 'note', label: 'Note' },
    { value: 'title', label: 'Title' },
    ...Object.entries(customFields)
      .filter(([, field]) => field.type === 'text')
      .map(([key, field]) => ({ value: `custom-${key}`, label: `Custom: ${field.label}` })),
  ];

  return [
    {
      title: OptionTitle.DataSources,
      collapsible: true,
      options: [
        {
          id: 'script',
          title: 'Script',
          description: `The field which holds the script. ${localNote}`,
          type: 'option',
          values: scriptFields,
          defaultValue: shared.script,
        },
        {
          id: 'heading',
          title: 'Heading',
          description: `What to show above the script of each event. ${localNote}`,
          type: 'option',
          values: headingOptions,
          defaultValue: shared.heading,
        },
      ],
    },
    {
      title: OptionTitle.BehaviourOptions,
      collapsible: true,
      options: [
        {
          id: 'remoteControl',
          title: 'Remote screen',
          description:
            'Shows the shared teleprompter, which every remote screen follows. Drive it from a controller view or the integration API',
          type: 'boolean',
          defaultValue: defaults.remoteControl,
        },
        {
          id: 'control',
          title: 'Controller',
          description:
            'Shows the shared teleprompter like a remote screen, and drives every remote screen with the keyboard, the mouse wheel and the on-screen buttons',
          type: 'boolean',
          defaultValue: defaults.control,
        },
        {
          id: 'followLoaded',
          title: 'Follow loaded event',
          description: `Loading an event moves the reader to it, and playback stops at the end of each event. ${localNote}`,
          type: 'boolean',
          defaultValue: shared.followLoaded,
        },
        {
          id: 'speed',
          title: 'Speed',
          description: `Starting speed in lines per minute (${bounds.speed[0]} to ${bounds.speed[1]}), which the arrow keys change live. Local view only`,
          type: 'number',
          defaultValue: defaults.speed,
        },
      ],
    },
    {
      title: OptionTitle.ElementVisibility,
      collapsible: true,
      options: [
        {
          id: 'onlyPlaying',
          title: 'Show only the playing event',
          description:
            'Hides the rest of the script, leaving the loaded event and its group title. Shows the whole script while nothing is loaded',
          type: 'boolean',
          defaultValue: defaults.onlyPlaying,
        },
        {
          id: 'showGroups',
          title: 'Group titles',
          description: `Shows the group title when the script enters a group. ${localNote}`,
          type: 'boolean',
          defaultValue: shared.showGroups,
        },
        {
          id: 'hideEmpty',
          title: 'Hide events without a script',
          description: `Leaves out events with no script text. ${localNote}`,
          type: 'boolean',
          defaultValue: shared.hideEmpty,
        },
      ],
    },
    {
      title: OptionTitle.StyleOverride,
      collapsible: true,
      options: [
        {
          id: 'charsPerLine',
          title: 'Characters per line',
          description: `Where lines break (${teleprompterCharsPerLine.min}-${teleprompterCharsPerLine.max}). ${localNote}`,
          type: 'number',
          defaultValue: shared.charsPerLine,
        },
        {
          id: 'lineHeight',
          title: 'Line height',
          description: `Spacing between lines, as a multiple of the text size (${bounds.lineHeight[0]}-${bounds.lineHeight[1]})`,
          type: 'number',
          defaultValue: defaults.lineHeight,
        },
        {
          id: 'textWidth',
          title: 'Text width',
          description:
            'Width of the text as a percentage of the screen. The text is sized so the longest line fills it. Narrower means less eye movement',
          type: 'number',
          defaultValue: defaults.textWidth,
        },
        {
          id: 'readingLine',
          title: 'Reading line',
          description: 'Shows a marker beside the line to read',
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
            'Mirrors the view horizontally, which is what a beam splitter rig needs. Flip Screen in the navigation menu flips both axes at once, which is a rotation rather than a mirror',
          type: 'boolean',
          defaultValue: defaults.flipH,
        },
        {
          id: 'flipV',
          title: 'Flip vertically',
          description: 'Mirrors the view vertically. Note this also moves the reading line',
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

/** The query for a local view's script, passing on only the settings it sets */
function getScriptSearch(getParam: (key: string) => string | null): string {
  const search = new URLSearchParams();
  for (const key of localScriptParams) {
    const value = getParam(key);
    if (value !== null && value !== '') search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function getOptionsFromParams(
  searchParams: URLSearchParams,
  defaultValues?: URLSearchParams,
): TeleprompterOptions {
  const getParam = (key: string) => defaultValues?.get(key) ?? searchParams.get(key);

  return {
    remoteControl: toBoolean(getParam('remoteControl'), defaults.remoteControl),
    control: toBoolean(getParam('control'), defaults.control),
    onlyPlaying: toBoolean(getParam('onlyPlaying'), defaults.onlyPlaying),
    lineHeight: toNumber(getParam('lineHeight'), bounds.lineHeight, defaults.lineHeight),
    textWidth: toNumber(getParam('textWidth'), bounds.textWidth, defaults.textWidth),
    readingLine: toBoolean(getParam('readingLine'), defaults.readingLine),
    readingLinePos: toNumber(getParam('readingLinePos'), bounds.readingLinePos, defaults.readingLinePos),
    flipH: toBoolean(getParam('flipH'), defaults.flipH),
    flipV: toBoolean(getParam('flipV'), defaults.flipV),
    scriptSearch: getScriptSearch(getParam),
    followLoaded: getParam('followLoaded') === null ? null : toBoolean(getParam('followLoaded'), false),
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
