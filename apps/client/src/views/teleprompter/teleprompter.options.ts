import type { CustomFields, TeleprompterHeading, TeleprompterSettings } from 'ontime-types';
import { teleprompterCharsPerLine, teleprompterSpeed } from 'ontime-utils';
import { use, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { OptionTitle } from '../../common/components/view-params-editor/constants';
import type { ViewOption } from '../../common/components/view-params-editor/viewParams.types';
import { PresetContext } from '../../common/context/PresetContext';
import { isStringBoolean } from '../common/viewUtils';

/** What a teleprompter view does: run on its own, follow the controller, or drive every remote screen */
export type TeleprompterRole = 'local' | 'remote' | 'controller';

export type TeleprompterOptions = {
  role: TeleprompterRole;
  onlyLoaded: boolean;
  lineHeight: number;
  textWidth: number;
  readingLine: boolean;
  readingLinePos: number;
  flipH: boolean;
  flipV: boolean;
  /** a local view's own script settings, as the query for its script, empty for the shared ones */
  scriptSearch: string;
  /** a local view's own playback mode, true to stop at the end of each event, or null to use the shared one */
  followLoaded: boolean | null;
  /** a local view's starting speed, in lines per minute */
  speed: number;
};

/** Options which shape a local view's script, which remote screens and controllers take from the project instead */
const localScriptParams = ['script', 'charsPerLine', 'heading', 'showGroups', 'hideEmpty'] as const;

export const defaults: TeleprompterOptions = {
  role: 'local',
  onlyLoaded: false,
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

const roles: { value: TeleprompterRole; label: string }[] = [
  { value: 'local', label: 'Local: runs on its own' },
  { value: 'remote', label: 'Remote screen: follows the controller' },
  { value: 'controller', label: 'Controller: drives every remote screen' },
];

export const roleLabels: Record<TeleprompterRole, string> = {
  local: 'Local',
  remote: 'Remote screen',
  controller: 'Controller',
};

const headingOptions: { value: TeleprompterHeading; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'cue', label: 'Cue' },
  { value: 'both', label: 'Cue and title' },
  { value: 'none', label: 'None' },
];

const playbackModes = [
  { value: 'event', label: 'Stop at the end of each event' },
  { value: 'script', label: 'Play through the script' },
];

/**
 * The view options for a role
 * Remote screens and controllers take the script and the playback mode from the project settings,
 * so only a local view offers them, defaulting to the project's
 */
export function getTeleprompterOptions(
  customFields: CustomFields,
  shared: TeleprompterSettings,
  role: TeleprompterRole,
): ViewOption[] {
  const isLocal = role === 'local';
  const scriptFields = [
    { value: 'note', label: 'Note' },
    { value: 'title', label: 'Title' },
    ...Object.entries(customFields)
      .filter(([, field]) => field.type === 'text')
      .map(([key, field]) => ({ value: `custom-${key}`, label: `Custom: ${field.label}` })),
  ];

  const roleOption: ViewOption = {
    title: OptionTitle.BehaviourOptions,
    collapsible: true,
    options: [
      {
        id: 'role',
        title: 'Role',
        description:
          'Local views run on their own. Remote screens all show the same line, driven by a controller view, Companion or the integration API. Script and playback settings for remote screens and controllers are in the project settings',
        type: 'option',
        values: roles,
        defaultValue: defaults.role,
      },
      ...(isLocal
        ? [
            {
              id: 'playback',
              title: 'Playback',
              description:
                'Stop at the end of each event follows the event Ontime loads. Play through reads on to the end of the script',
              type: 'option' as const,
              values: playbackModes,
              defaultValue: shared.followLoaded ? 'event' : 'script',
            },
            {
              id: 'speed',
              title: 'Speed',
              description: `Starting speed in lines per minute (${bounds.speed[0]} to ${bounds.speed[1]}). The arrow keys change it while the view runs`,
              type: 'number' as const,
              defaultValue: defaults.speed,
            },
          ]
        : []),
    ],
  };

  const scriptOption: ViewOption = {
    title: OptionTitle.DataSources,
    collapsible: true,
    options: [
      {
        id: 'script',
        title: 'Script',
        description: 'The field which holds the script',
        type: 'option',
        values: scriptFields,
        defaultValue: shared.script,
      },
      {
        id: 'heading',
        title: 'Heading',
        description: 'What to show above the script of each event',
        type: 'option',
        values: headingOptions,
        defaultValue: shared.heading,
      },
      {
        id: 'charsPerLine',
        title: 'Characters per line',
        description: `How many characters fit on a line (${teleprompterCharsPerLine.min}-${teleprompterCharsPerLine.max}), which sets the text size. Fewer characters make larger text`,
        type: 'number',
        defaultValue: shared.charsPerLine,
      },
      {
        id: 'showGroups',
        title: 'Group titles',
        description: 'Shows the group title when the script enters a group',
        type: 'boolean',
        defaultValue: shared.showGroups,
      },
      {
        id: 'hideEmpty',
        title: 'Hide events without a script',
        description: 'Leaves out events with no script text',
        type: 'boolean',
        defaultValue: shared.hideEmpty,
      },
    ],
  };

  return [
    roleOption,
    ...(isLocal ? [scriptOption] : []),
    {
      title: OptionTitle.ElementVisibility,
      collapsible: true,
      options: [
        {
          id: 'onlyLoaded',
          title: 'Show only the loaded event',
          description: 'Hides the rest of the script. Until an event is loaded, the screen says it is waiting for one',
          type: 'boolean',
          defaultValue: defaults.onlyLoaded,
        },
      ],
    },
    {
      title: OptionTitle.StyleOverride,
      collapsible: true,
      options: [
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
            'Width of the text as a percentage of the screen. The longest line fills it. Narrower means less eye movement',
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

function toPlaybackMode(value: string | null): boolean | null {
  if (value === 'event') return true;
  if (value === 'script') return false;
  return null;
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
    role: roles.find(({ value }) => value === getParam('role'))?.value ?? defaults.role,
    onlyLoaded: toBoolean(getParam('onlyLoaded'), defaults.onlyLoaded),
    lineHeight: toNumber(getParam('lineHeight'), bounds.lineHeight, defaults.lineHeight),
    textWidth: toNumber(getParam('textWidth'), bounds.textWidth, defaults.textWidth),
    readingLine: toBoolean(getParam('readingLine'), defaults.readingLine),
    readingLinePos: toNumber(getParam('readingLinePos'), bounds.readingLinePos, defaults.readingLinePos),
    flipH: toBoolean(getParam('flipH'), defaults.flipH),
    flipV: toBoolean(getParam('flipV'), defaults.flipV),
    scriptSearch: getScriptSearch(getParam),
    followLoaded: toPlaybackMode(getParam('playback')),
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
