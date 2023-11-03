import { UserFields } from 'ontime-types';

import { ParamField } from './types';

export const TIME_FORMAT_OPTION: ParamField = {
  id: 'format',
  title: '12  / 24 hour timer',
  description: 'Whether to show the time in 12 or 24 hour mode. Overrides the global setting from preferences',
  type: 'option',
  values: { '12': '12 hour AM/PM', '24': '24 hour' },
};

export const CLOCK_OPTIONS: ParamField[] = [
  TIME_FORMAT_OPTION,
  {
    id: 'key',
    title: 'Key Colour',
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
    values: { start: 'Start', center: 'Center', end: 'End' },
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
    values: { start: 'Start', center: 'Center', end: 'End' },
  },
  {
    id: 'offsety',
    title: 'Offset Vertical',
    description: 'Offsets the timer vertical position by a given amount in pixels',
    type: 'number',
  },
];

export const TIMER_OPTIONS: ParamField[] = [TIME_FORMAT_OPTION];

export const MINIMAL_TIMER_OPTIONS: ParamField[] = [
  {
    id: 'key',
    title: 'Key Colour',
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
    values: { start: 'Start', center: 'Center', end: 'End' },
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
    values: { start: 'Start', center: 'Center', end: 'End' },
  },
  {
    id: 'offsety',
    title: 'Offset Vertical',
    description: 'Offsets the timer vertical position by a given amount in pixels',
    type: 'number',
  },
  {
    id: 'hideovertime',
    title: 'Hide Overtime',
    description: 'Whether to suppress overtime styles (red borders and red text)',
    type: 'boolean',
  },
  {
    id: 'hidemessages',
    title: 'Hide Message Overlay',
    description: 'Whether to hide the overlay from showing timer screen messages',
    type: 'boolean',
  },
  {
    id: 'hideendmessage',
    title: 'Hide End Message',
    description: 'Whether to hide end message and continue showing the clock if timer is in overtime',
    type: 'boolean',
  },
];

export const LOWER_THIRDS_OPTIONS: ParamField[] = [
  {
    id: 'preset',
    title: 'Preset',
    description: 'Selects a style preset (0-1)',
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
    title: 'Text Colour',
    description: 'Text colour in hexadecimal',
    type: 'string',
  },
  {
    id: 'bg',
    title: 'Text Background',
    description: 'Text background colour in hexadecimal',
    type: 'string',
  },
  {
    id: 'key',
    title: 'Key Colour',
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

export const BACKSTAGE_OPTIONS: ParamField[] = [
  TIME_FORMAT_OPTION,
  {
    id: 'eventsPerPage',
    title: 'Number of events on page',
    description: '',
    type: 'number',
  },
  {
    id: 'followSelected',
    title: 'Follow selected event',
    description: '',
    type: 'boolean',
  },
];

export const PUBLIC_OPTIONS: ParamField[] = [
  TIME_FORMAT_OPTION,
  {
    id: 'eventsPerPage',
    title: 'Number of events on page',
    description: '',
    type: 'number',
  },
  {
    id: 'followSelected',
    title: 'Follow selected event',
    description: '',
    type: 'boolean',
  },
];
export const STUDIO_CLOCK_OPTIONS: ParamField[] = [
  TIME_FORMAT_OPTION,
  {
    id: 'seconds',
    title: 'Show Seconds',
    description: 'Shows seconds in clock',
    type: 'boolean',
  },
];

export const getOperatorOptions = (userFields: UserFields): ParamField[] => {
  return [
    TIME_FORMAT_OPTION,
    {
      id: 'showseconds',
      title: 'Show seconds',
      description: 'Schedule shows hh:mm:ss',
      type: 'boolean',
    },
    {
      id: 'hidepast',
      title: 'Hide Past Events',
      description: 'Whether to events that have passed',
      type: 'boolean',
    },
    {
      id: 'main',
      title: 'Main data field',
      description: 'Field to be shown in the first line of text',
      type: 'option',
      values: {
        title: 'Title',
        subtitle: 'Subtitle',
        presenter: 'Presenter',
      },
    },
    {
      id: 'secondary',
      title: 'Secondary data field',
      description: 'Field to be shown in the second line of text',
      type: 'option',
      values: {
        title: 'Title',
        subtitle: 'Subtitle',
        presenter: 'Presenter',
      },
    },
    {
      id: 'subscribe',
      title: 'Highlight Field',
      description: 'Choose a field to highlight',
      type: 'option',
      values: {
        user0: userFields.user0 || 'user0',
        user1: userFields.user1 || 'user1',
        user2: userFields.user2 || 'user2',
        user3: userFields.user3 || 'user3',
        user4: userFields.user4 || 'user4',
        user5: userFields.user5 || 'user5',
        user6: userFields.user6 || 'user6',
        user7: userFields.user7 || 'user7',
        user8: userFields.user8 || 'user8',
        user9: userFields.user9 || 'user9',
      },
    },
  ];
};
