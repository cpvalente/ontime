import { defineSlotRecipe } from '@chakra-ui/react';
import { alertAnatomy } from '@chakra-ui/react/anatomy';

export const ontimeAlertRecipe = defineSlotRecipe({
  slots: alertAnatomy.keys(),
  base: {
    content: {
      fontSize: 'calc(1rem - 1px)',
      backgroundColor: '#202020', // $gray-1200
      color: '#e2e2e2', // $gray-200
      borderRadius: '3px',
    },
    indicator: {
      alignSelf: 'start',
      color: '#578AF4', // $blue-500
    },
  },
});
