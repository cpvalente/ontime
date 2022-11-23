import { extendTheme } from '@chakra-ui/react';

import { ontimeButtonFilled, ontimeButtonOutlined, ontimeButtonSubtle } from './ontimeButton';

const theme = extendTheme({
  components: {
    Button: {
      baseStyle: {
        borderRadius: '3px',
      },
      variants: {
        'ontime-filled': {...ontimeButtonFilled},
        'ontime-outlined': {...ontimeButtonOutlined},
        'ontime-subtle': {...ontimeButtonSubtle},
      }
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: 3,
        },
      },
      sizes: {},
      variants: {
        filled: {
          field: {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            _hover: {
              backgroundColor: 'rgba(255, 255, 255, 0.13)',
            },
          },
        },
      },
      defaultProps: {
        variant: null, // null here
      },
    },
    Textarea: {
      baseStyle: {
        borderRadius: 3,
      },
      variants: {
        filled: {
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          _hover: {
            backgroundColor: 'rgba(255, 255, 255, 0.13)',
          },
        },
      },
      defaultProps: {
        variant: null, // null here
      },
    },
  },
});

export default theme;
