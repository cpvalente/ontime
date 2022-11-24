import { extendTheme } from '@chakra-ui/react';

import { ontimeButtonFilled, ontimeButtonOutlined, ontimeButtonSubtle } from './ontimeButton';
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
      },
    },
    Input: {
      baseStyle: {
        borderRadius: '3px',
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
  },
});

export default theme;
