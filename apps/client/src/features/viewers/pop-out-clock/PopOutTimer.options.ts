import { hideTimerSeconds } from '../../../common/components/view-params-editor/constants';
import { ViewOption } from '../../../common/components/view-params-editor/types';

export const POPOUT_TIMER_OPTIONS: ViewOption[] = [
  { section: 'Timer Options' },
  hideTimerSeconds,
  { section: 'Element visibility' },
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
  { section: 'View style override' },
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
];
