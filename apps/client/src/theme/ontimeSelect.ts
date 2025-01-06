import { defineSlotRecipe } from '@chakra-ui/react';
import { nativeSelectAnatomy, selectAnatomy } from '@chakra-ui/react/anatomy';

export const ontimeSelectRecipe = defineSlotRecipe({
  slots: selectAnatomy.keys(),
  base: {
    control: {
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
    valueText: {
      color: '#e2e2e2', // $gray-200
    },
    trigger: {
      border: 0,
    },
    indicator: {
      color: '#e2e2e2', // $gray-200
    },
  },
});

export const ontimeNativeSelectRecipe = defineSlotRecipe({
  slots: nativeSelectAnatomy.keys(),
  base: {
    root: {
      background: '#262626', // $gray-1100
      borderRadius: '3px',
      fontWeight: '400',
      color: '#e2e2e2', // $gray-200
    },
    field: {
      border: '0',
      _hover: {
        background: '#404040', // $gray-1000
      },
      _focus: {
        background: '#404040', // $gray-1000
        color: '#f6f6f6', // $gray-50
        outline: '1px solid #578AF4', // $blue-500
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
