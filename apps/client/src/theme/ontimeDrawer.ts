import { defineSlotRecipe } from '@chakra-ui/react';
import { drawerAnatomy } from '@chakra-ui/react/anatomy';

export const ontimeDrawerRecipe = defineSlotRecipe({
  slots: drawerAnatomy.keys(),
  base: {
    header: {
      color: '#fefefe', // $gray-50
      backgroundColor: '#202020', // $gray-1250
    },
    body: {
      display: 'flex',
      flexDirection: 'column',
      color: '#fefefe', // $gray-50
      backgroundColor: '#202020', // $gray-1250
    },
    footer: {
      backgroundColor: '#202020', // $gray-1250
    },
    closeTrigger: {
      color: '#fefefe', // $gray-50
      _hover: {
        color: '#303030', // $gray-1050
        backgroundColor: '#fefefe', // $gray-50
      },
    },
  },
});
