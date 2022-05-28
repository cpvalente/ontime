import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  components: {
    Button: {
      baseStyle: {
        borderRadius: '4px',
      },
    },
  },
});

export default theme;
