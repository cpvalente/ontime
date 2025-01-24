import { getTimeOption, OptionTitle } from '../../../common/components/view-params-editor/constants';
import { ViewOption } from '../../../common/components/view-params-editor/types';

export const getClockOptions = (timeFormat: string): ViewOption[] => [
  { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
  {
    title: OptionTitle.ClockOptions,
    collapsible: true,
    options: [
      {
        id: 'key',
        title: 'Key Colour',
        description: 'Background or key colour for entire view. Default: #000000',
        type: 'colour',
        defaultValue: '000000',
      },
      {
        id: 'text',
        title: 'Text Colour',
        description: 'Text colour. Default: #FFFFFF',
        type: 'colour',
        defaultValue: 'FFFFFF',
      },
      {
        id: 'textbg',
        title: 'Text Background',
        description: 'Background colour for timer text. Default: #FFF0 (transparent)',
        type: 'colour',
        defaultValue: 'FFF0',
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
    ],
  },
];
