import { defineSlotRecipe } from '@chakra-ui/react';
import { nativeSelectAnatomy } from '@chakra-ui/react/anatomy';

export const ontimeSelectRecipe = defineSlotRecipe({
  slots: nativeSelectAnatomy.keys(),
  base: {
    field: {
      color: '#e2e2e2', // $gray-200
      borderRadius: '3px',
      fontWeight: '400',
      background: '#262626', // $gray-1100
      border: '1px solid transparent',
      _hover: {
        background: '#404040', // $gray-1000
      },
      _focus: {
        background: '#404040', // $gray-1000
        color: '#f6f6f6', // $gray-50
        border: '1px solid #578AF4', // $blue-500
      },
      _disabled: {
        _hover: {
          background: '#262626', // $gray-1100
        },
      },
    },
    indicator: {
      color: '#e2e2e2', // $gray-200
    },
  },
});
