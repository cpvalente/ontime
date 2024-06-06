import { CustomFields } from 'ontime-types';

import { capitaliseFirstLetter } from '../../../features/viewers/common/viewUtils';

import { ParamField } from './types';

const makeOptionsFromCustomFields = (customFields: CustomFields, additionalOptions?: Record<string, string>) => {
  const customFieldOptions = Object.entries(customFields).reduce((acc, [key, value]) => {
    return { ...acc, [`custom-${key}`]: `Custom: ${value.label}` };
  }, additionalOptions ?? {});
  return customFieldOptions;
};

const getTimeOption = (timeFormat: string): ParamField => {
  const placeholder = `${timeFormat} (default)`;
  return {
    id: 'timeformat',
    title: 'Time format string, taken from the Application Settings',
    description: 'Format for auxiliar time fields (not the running), eg. HH:mm:ss or hh:mm:ss a, see docs for help',
    type: 'string',
    placeholder,
  };
};

const hideTimerSeconds: ParamField = {
  id: 'hideTimerSeconds',
  title: 'Hide seconds in timer',
  description: 'Whether to hide seconds in the running timer',
  type: 'boolean',
  defaultValue: false,
};

const showLeadingZeros: ParamField = {
  id: 'showLeadingZeros',
  title: 'Show leading zeros in timer',
  description: 'Whether to show leading zeros in the running timer',
  type: 'boolean',
  defaultValue: false,
};

export const getClockOptions = (timeFormat: string): ParamField[] => [
  getTimeOption(timeFormat),
  {
    id: 'key',
    title: 'Key Colour',
    description: 'Background colour in hexadecimal',
    prefix: '#',
    type: 'string',
    placeholder: '00000000 (default)',
  },
  {
    id: 'text',
    title: 'Text Colour',
    description: 'Text colour in hexadecimal',
    prefix: '#',
    type: 'string',
    placeholder: 'fffff (default)',
  },
  {
    id: 'textbg',
    title: 'Text Background',
    description: 'Colour of text background in hexadecimal',
    prefix: '#',
    type: 'string',
    placeholder: '00000000 (default)',
  },
  {
    id: 'font',
    title: 'Font',
    description: 'Font family, will use the fonts available in the system',
    type: 'string',
    placeholder: 'Arial Black (default)',
  },
  {
    id: 'size',
    title: 'Text Size',
    description: 'Scales the current style (0.5 = 50% 1 = 100% 2 = 200%)',
    type: 'number',
    placeholder: '1 (default)',
  },
  {
    id: 'alignx',
    title: 'Align Horizontal',
    description: 'Moves the horizontally in page to start = left | center | end = right',
    type: 'option',
    values: { start: 'Start', center: 'Center', end: 'End' },
    defaultValue: 'center',
  },
  {
    id: 'offsetx',
    title: 'Offset Horizontal',
    description: 'Offsets the timer horizontal position by a given amount in pixels',
    type: 'number',
    placeholder: '0 (default)',
  },
  {
    id: 'aligny',
    title: 'Align Vertical',
    description: 'Moves the vertically in page to start = left | center | end = right',
    type: 'option',
    values: { start: 'Start', center: 'Center', end: 'End' },
    defaultValue: 'center',
  },
  {
    id: 'offsety',
    title: 'Offset Vertical',
    description: 'Offsets the timer vertical position by a given amount in pixels',
    type: 'number',
    placeholder: '0 (default)',
  },
];

export const getTimerOptions = (timeFormat: string, customFields: CustomFields): ParamField[] => {
  const mainOptions = makeOptionsFromCustomFields(customFields, { title: 'Title' });
  const secondaryOptions = makeOptionsFromCustomFields(customFields, { note: 'Note' });
  return [
    getTimeOption(timeFormat),
    hideTimerSeconds,
    showLeadingZeros,
    {
      id: 'hideClock',
      title: 'Hide Time Now',
      description: 'Hides the Time Now field',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'main',
      title: 'Main text',
      description: 'Select the data source for the main text',
      type: 'option',
      values: mainOptions,
      defaultValue: 'Title',
    },
    {
      id: 'secondary-src',
      title: 'Secondary text',
      description: 'Select the data source for the secondary text',
      type: 'option',
      values: secondaryOptions,
      defaultValue: '',
    },
    {
      id: 'hideCards',
      title: 'Hide Cards',
      description: 'Hides the Now and Next cards',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'hideProgress',
      title: 'Hide progress bar',
      description: 'Hides the progress bar',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'hideMessage',
      title: 'Hide Presenter Message',
      description: 'Prevents the screen from displaying messages from the presenter',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'hideExternal',
      title: 'Hide External',
      description: 'Prevents the screen from displaying the external field',
      type: 'boolean',
      defaultValue: false,
    },
  ];
};

export const MINIMAL_TIMER_OPTIONS: ParamField[] = [
  hideTimerSeconds,
  {
    id: 'key',
    title: 'Key Colour',
    description: 'Background colour in hexadecimal',
    prefix: '#',
    type: 'string',
    placeholder: '00000000 (default)',
  },
  {
    id: 'text',
    title: 'Text Colour',
    description: 'Text colour in hexadecimal',
    prefix: '#',
    type: 'string',
    placeholder: 'fffff (default)',
  },
  {
    id: 'textbg',
    title: 'Text Background',
    description: 'Colour of text background in hexadecimal',
    prefix: '#',
    type: 'string',
    placeholder: '00000000 (default)',
  },
  {
    id: 'font',
    title: 'Font',
    description: 'Font family, will use the fonts available in the system',
    type: 'string',
    placeholder: 'Arial Black (default)',
  },
  {
    id: 'size',
    title: 'Text Size',
    description: 'Scales the current style (0.5 = 50% 1 = 100% 2 = 200%)',
    type: 'number',
    placeholder: '1 (default)',
  },
  {
    id: 'alignx',
    title: 'Align Horizontal',
    description: 'Moves the horizontally in page to start = left | center | end = right',
    type: 'option',
    values: { start: 'Start', center: 'Center', end: 'End' },
    defaultValue: 'center',
  },
  {
    id: 'offsetx',
    title: 'Offset Horizontal',
    description: 'Offsets the timer horizontal position by a given amount in pixels',
    type: 'number',
    placeholder: '0 (default)',
  },
  {
    id: 'aligny',
    title: 'Align Vertical',
    description: 'Moves the vertically in page to start = left | center | end = right',
    type: 'option',
    values: { start: 'Start', center: 'Center', end: 'End' },
    defaultValue: 'center',
  },
  {
    id: 'offsety',
    title: 'Offset Vertical',
    description: 'Offsets the timer vertical position by a given amount in pixels',
    type: 'number',
    placeholder: '0 (default)',
  },
  {
    id: 'hideovertime',
    title: 'Hide Overtime',
    description: 'Whether to suppress overtime styles (red borders and red text)',
    type: 'boolean',
    defaultValue: false,
  },
  {
    id: 'hideendmessage',
    title: 'Hide End Message',
    description: 'Whether to hide end message and continue showing the clock if timer is in overtime',
    type: 'boolean',
    defaultValue: false,
  },
];

export const getLowerThirdOptions = (customFields: CustomFields): ParamField[] => {
  const topSourceOptions = makeOptionsFromCustomFields(customFields, {
    title: 'Title',
  });

  const bottomSourceOptions = makeOptionsFromCustomFields(customFields, {
    title: 'Title',
    none: 'None',
  });

  return [
    {
      id: 'trigger',
      title: 'Animation Trigger',
      description: '',
      type: 'option',
      values: {
        event: 'Event Load',
        manual: 'Manual',
      },
      defaultValue: 'manual',
    },
    {
      id: 'top-src',
      title: 'Top Text',
      description: '',
      type: 'option',
      values: topSourceOptions,
      defaultValue: 'title',
    },
    {
      id: 'bottom-src',
      title: 'Bottom Text',
      description: 'Select the data source for the bottom element',
      type: 'option',
      values: bottomSourceOptions,
      defaultValue: 'none',
    },
    {
      id: 'top-colour',
      title: 'Top Text Colour',
      description: 'Top text colour in hexadecimal',
      prefix: '#',
      type: 'string',
      placeholder: '0000ff (default)',
    },
    {
      id: 'bottom-colour',
      title: 'Bottom Text Colour',
      description: 'Bottom text colour in hexadecimal',
      prefix: '#',
      type: 'string',
      placeholder: '0000ff (default)',
    },
    {
      id: 'top-bg',
      title: 'Top Background Colour',
      description: 'Top text background colour in hexadecimal',
      prefix: '#',
      type: 'string',
      placeholder: '00000000 (default)',
    },
    {
      id: 'bottom-bg',
      title: 'Bottom Background Colour',
      description: 'Bottom text background colour in hexadecimal',
      prefix: '#',
      type: 'string',
      placeholder: '00000000 (default)',
    },
    {
      id: 'top-size',
      title: 'Top Text Size',
      description: 'Font size of the top text',
      type: 'string',
      placeholder: '65px',
    },
    {
      id: 'bottom-size',
      title: 'Bottom Text Size',
      description: 'Font size of the bottom text',
      type: 'string',
      placeholder: '64px',
    },
    {
      id: 'width',
      title: 'Minimum Width',
      description: 'Minimum Width of the element',
      type: 'number',
      prefix: '%',
      placeholder: '45 (default)',
    },
    {
      id: 'transition',
      title: 'Transition',
      description: 'Transition in time in seconds (default 3)',
      type: 'number',
      placeholder: '3 (default)',
    },
    {
      id: 'delay',
      title: 'Delay',
      description: 'Delay between transition in and out in seconds (default 3)',
      type: 'number',
      placeholder: '3 (default)',
    },
    {
      id: 'key',
      title: 'Key Colour',
      description: 'Colour of the background',
      prefix: '#',
      type: 'string',
      placeholder: 'ffffffff (default)',
    },
    {
      id: 'line-colour',
      title: 'Line Colour',
      description: 'Colour of the line',
      prefix: '#',
      type: 'string',
      placeholder: 'ff0000ff (default)',
    },
  ];
};

export const getBackstageOptions = (timeFormat: string, customFields: CustomFields): ParamField[] => {
  const secondaryOptions = makeOptionsFromCustomFields(customFields, { note: 'Note' });

  return [
    getTimeOption(timeFormat),
    {
      id: 'hidePast',
      title: 'Hide past events',
      description: 'Scheduler will only show upcoming events',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'stopCycle',
      title: 'Stop cycling through event pages',
      description: 'Schedule will not auto-cycle through events',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'eventsPerPage',
      title: 'Events per page',
      description: 'Sets the number of events on the page, can cause overflow',
      type: 'number',
      placeholder: '8 (default)',
    },
    {
      id: 'secondary-src',
      title: 'Event secondary text',
      description: 'Select the data source for auxiliary text shown in now and next cards',
      type: 'option',
      values: secondaryOptions,
      defaultValue: '',
    },
  ];
};

export const getPublicOptions = (timeFormat: string, customFields: CustomFields): ParamField[] => {
  const secondaryOptions = makeOptionsFromCustomFields(customFields);

  return [
    getTimeOption(timeFormat),
    {
      id: 'hidePast',
      title: 'Hide past events',
      description: 'Scheduler will only show upcoming events',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'stopCycle',
      title: 'Stop cycling through event pages',
      description: 'Schedule will not auto-cycle through events',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'eventsPerPage',
      title: 'Events per page',
      description: 'Sets the number of events on the page, can cause overflow',
      type: 'number',
      placeholder: '8 (default)',
    },
    {
      id: 'secondary-src',
      title: 'Event secondary text',
      description: 'Select the data source for auxiliary text shown in now and next cards',
      type: 'option',
      values: secondaryOptions,
      defaultValue: '',
    },
  ];
};

export const getStudioClockOptions = (timeFormat: string): ParamField[] => [
  getTimeOption(timeFormat),
  hideTimerSeconds,
];

export const getOperatorOptions = (customFields: CustomFields, timeFormat: string): ParamField[] => {
  const fieldOptions = makeOptionsFromCustomFields(customFields, { title: 'Title', note: 'Note' });

  const customFieldSelect = Object.keys(customFields).reduce((acc, key) => {
    return { ...acc, [key]: `Custom: ${capitaliseFirstLetter(key)}` };
  }, {});

  return [
    getTimeOption(timeFormat),
    {
      id: 'hidepast',
      title: 'Hide Past Events',
      description: 'Whether to events that have passed',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'main',
      title: 'Main data field',
      description: 'Field to be shown in the first line of text',
      type: 'option',
      values: fieldOptions,
      defaultValue: 'title',
    },
    {
      id: 'secondary',
      title: 'Secondary data field',
      description: 'Field to be shown in the second line of text',
      type: 'option',
      values: fieldOptions,
      defaultValue: '',
    },
    {
      id: 'subscribe',
      title: 'Highlight Field',
      description: 'Choose a custom field to highlight',
      type: 'option',
      values: customFieldSelect,
      defaultValue: '',
    },
    {
      id: 'shouldEdit',
      title: 'Edit custom field',
      description: 'Allows editing an events selected custom field by long pressing.',
      type: 'boolean',
      defaultValue: false,
    },
  ];
};

export const getCountdownOptions = (timeFormat: string): ParamField[] => [getTimeOption(timeFormat), hideTimerSeconds];
