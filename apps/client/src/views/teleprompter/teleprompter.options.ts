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
};

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
};

const bounds = {
  lineHeight: [1, 4],
  textWidth: [20, 100],
  readingLinePos: [0, 100],
} as const;

export const teleprompterOptions: ViewOption[] = [
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
    remoteControl: toBoolean(getParam('remoteControl'), defaults.remoteControl),
    control: toBoolean(getParam('control'), defaults.control),
    onlyPlaying: toBoolean(getParam('onlyPlaying'), defaults.onlyPlaying),
    lineHeight: toNumber(getParam('lineHeight'), bounds.lineHeight, defaults.lineHeight),
    textWidth: toNumber(getParam('textWidth'), bounds.textWidth, defaults.textWidth),
    readingLine: toBoolean(getParam('readingLine'), defaults.readingLine),
    readingLinePos: toNumber(getParam('readingLinePos'), bounds.readingLinePos, defaults.readingLinePos),
    flipH: toBoolean(getParam('flipH'), defaults.flipH),
    flipV: toBoolean(getParam('flipV'), defaults.flipV),
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
