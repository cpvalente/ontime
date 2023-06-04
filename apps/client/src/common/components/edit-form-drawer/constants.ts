import { ParamField } from './types';

export const CLOCK_OPTIONS: ParamField[] = [
  {
    id: 'key',
    title: 'Key',
    description: 'Background colour in hexadecimal',
    type: 'string',
  },
  {
    id: 'text',
    title: 'Text Colour',
    description: 'Text colour in hexadecimal',
    type: 'string',
  },
  {
    id: 'textbg',
    title: 'Text Background',
    description: 'Colour of text background in hexadecimal',
    type: 'string',
  },
  {
    id: 'font',
    title: 'Font',
    description: 'Font family, will use the fonts available in the system',
    type: 'string',
  },
  {
    id: 'size',
    title: 'Text Size',
    description: 'Scales the current style (0.5 = 50% 1 = 100% 2 = 200%)',
    type: 'number',
  },
  {
    id: 'alignx',
    title: 'Align Horizontal',
    description: 'Moves the horizontally in page to start = left | center | end = right',
    type: 'option',
    values: ['start', 'center', 'end'],
  },
  {
    id: 'offsetx',
    title: 'Offset Horizontal',
    description: 'Offsets the timer horizontal position by a given amount in pixels',
    type: 'number',
  },
  {
    id: 'aligny',
    title: 'Align Vertical',
    description: 'Moves the vertically in page to start = left | center | end = right',
    type: 'option',
    values: ['start', 'center', 'end'],
  },
  {
    id: 'offsety',
    title: 'Offset Vertical',
    description: 'Offsets the timer vertical position by a given amount in pixels',
    type: 'number',
  },
  {
    id: 'hidenav',
    title: 'Hide Nav',
    description: 'Whether to hide the nav logo in the right corner',
    type: 'boolean',
  },
  {
    id: 'format',
    title: '12  / 24 hour timer',
    description: 'Whether to show the time in 12 or 24 hour mode. Overrides the global setting from preferences',
    type: 'option',
    values: ['12', '24'],
  },
];

export const TIMER_OPTIONS: ParamField[] = [
  {
    id: 'progress',
    title: 'Progress Bar',
    description: 'Whether bar counts up or down',
    type: 'option',
    values: ['up', 'down'],
  },
];

export const MINIMAL_TIMER_OPTIONS: ParamField[] = [
  {
    id: 'key',
    title: 'Key',
    description: 'Background colour in hexadecimal',
    type: 'string',
  },
  {
    id: 'text',
    title: 'Text Colour',
    description: 'Text colour in hexadecimal',
    type: 'string',
  },
  {
    id: 'textbg',
    title: 'Text Background',
    description: 'Colour of text background in hexadecimal',
    type: 'string',
  },
  {
    id: 'font',
    title: 'Font',
    description: 'Font family, will use the fonts available in the system',
    type: 'string',
  },
  {
    id: 'size',
    title: 'Text Size',
    description: 'Scales the current style (0.5 = 50% 1 = 100% 2 = 200%)',
    type: 'number',
  },
  {
    id: 'alignx',
    title: 'Align Horizontal',
    description: 'Moves the horizontally in page to start = left | center | end = right',
    type: 'option',
    values: ['start', 'center', 'end'],
  },
  {
    id: 'offsetx',
    title: 'Offset Horizontal',
    description: 'Offsets the timer horizontal position by a given amount in pixels',
    type: 'number',
  },
  {
    id: 'aligny',
    title: 'Align Vertical',
    description: 'Moves the vertically in page to start = left | center | end = right',
    type: 'option',
    values: ['start', 'center', 'end'],
  },
  {
    id: 'offsety',
    title: 'Offset Vertical',
    description: 'Offsets the timer vertical position by a given amount in pixels',
    type: 'number',
  },
  {
    id: 'hidenav',
    title: 'Hide Nav',
    description: 'Whether to hide the nav logo in the right corner',
    type: 'boolean',
  },
  {
    id: 'hideovertime',
    title: 'Hide Overtime',
    description: 'Whether to supress overtime styles (red borders and red text)',
    type: 'boolean',
  },
  {
    id: 'hidemessages',
    title: 'Hide Message Overlay',
    description: 'Whether to hide the overlay from showing timer screen messages',
    type: 'boolean',
  },
];

export const LOWER_THIRDS_OPTIONS: ParamField[] = [
  {
    id: 'preset',
    title: 'Preset',
    description: 'Selects a style preset',
    type: 'number',
  },
  {
    id: 'size',
    title: 'Size',
    description: 'Scales the current style (0.5 = 50% 1 = 100% 2 = 200%)',
    type: 'number',
  },
  {
    id: 'transition',
    title: 'Transition',
    description: 'Transition in time in seconds (default 5)',
    type: 'number',
  },
  {
    id: 'text',
    title: 'Text',
    description: 'Text colour in hexadecimal',
    type: 'string',
  },
  {
    id: 'bg',
    title: 'BG',
    description: 'Text background colour in hexadecimal',
    type: 'string',
  },
  {
    id: 'key',
    title: 'Key',
    description: 'Screen background colour in hexadecimal',
    type: 'string',
  },
  {
    id: 'fadeout',
    title: 'Fadeout',
    description: 'Time (in seconds) the lower third displays before fading out',
    type: 'number',
  },
];

export const STUDIO_CLOCK_OPTIONS: ParamField[] = [
  {
    id: 'seconds',
    title: 'Seconds',
    description: 'Shows seconds in clock',
    type: 'boolean',
  },
];
