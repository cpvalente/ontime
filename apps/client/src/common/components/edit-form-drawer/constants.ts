import { Field } from './types';

export const CLOCK_OPTIONS: Field[] = [
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
