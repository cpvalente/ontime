import { alertAnatomy } from '@chakra-ui/react/anatomy';
import { defineSlotRecipe } from '@chakra-ui/react/styled-system';

export const ontimeAlertRecipe = defineSlotRecipe({
  slots: alertAnatomy.keys(),
  base: {
    root: {
      fontSize: 'calc(1rem - 1px)',
      borderRadius: '3px',
    },
    title: {
      color: '#e2e2e2', // $gray-200
    },
    indicator: {
      alignSelf: 'start',
      color: '#578AF4', // $blue-500
    },
  },
});
