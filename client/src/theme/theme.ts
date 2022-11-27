import { extendTheme } from '@chakra-ui/react';

import {
  ontimeButtonFilled,
  ontimeButtonOutlined,
  ontimeButtonSubtle,
  ontimeButtonSubtleWhite,
} from './ontimeButton';
import { ontimeCheckboxOnDark } from './ontimeCheckbox';
import { ontimeMenuOnDark } from './ontimeMenu';
import { ontimeSelect } from './ontimeSelect';
import { ontimeSwitch } from './ontimeSwitch';
import { ontimeInputFilled, ontimeTextAreaFilled } from './ontimeTextInputs';

const theme = extendTheme({
  components: {
    Button: {
      baseStyle: {
        borderRadius: '3px',
      },
      variants: {
        'ontime-filled': { ...ontimeButtonFilled },
        'ontime-outlined': { ...ontimeButtonOutlined },
        'ontime-subtle': { ...ontimeButtonSubtle },
        'ontime-subtle-white': { ...ontimeButtonSubtleWhite },
      },
    },
    Checkbox: {
      variants: {
        'ontime-ondark': {...ontimeCheckboxOnDark},
      }
    },
    Editable: {
      baseStyle: {
        input: {
          borderRadius: '2px',
          width: '100%',
        },
        preview: {
          width: '100%',
        }
      }
    },
    Input: {
      baseStyle: {
        borderRadius: '2px',
        border: '1px',
      },
      variants: {
        'ontime-filled': { ...ontimeInputFilled },
      },
    },
    Textarea: {
      baseStyle: {
        borderRadius: '3px',
      },
      variants: {
        'ontime-filled': { ...ontimeTextAreaFilled },
      },
    },
    Switch: {
      variants: {
        'ontime': { ...ontimeSwitch },
      },
    },
    Select: {
      variants: {
        'ontime': { ...ontimeSelect },
      },
    },
    Menu: {
      variants: {
        'ontime-on-dark': { ...ontimeMenuOnDark },
      },
    },
  },
});

export default theme;
