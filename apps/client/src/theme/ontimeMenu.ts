import { defineSlotRecipe } from '@chakra-ui/react';
import { menuAnatomy } from '@chakra-ui/react/anatomy';

export const ontimeMenuRecipe = defineSlotRecipe({
  slots: menuAnatomy.keys(),
  base: {
    content: {
      borderRadius: '3px',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: '#202020', // $gray-1250
      zIndex: 100,
    },
    item: {
      color: '#ececec', // $gray-1030
      _hover: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        _disabled: {
          backgroundColor: 'transparent',
        },
      },
      _disabled: {
        color: '#b1b1b1', // $gray-400
      },
    },
    separator: {
      borderColor: 'rgba(255, 255, 255, 0.07)',
      background: 'transparent',
      opacity: 1,
    },
  },
});
