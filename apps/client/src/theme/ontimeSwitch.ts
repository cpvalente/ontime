import { defineSlotRecipe } from '@chakra-ui/react';
import { switchAnatomy } from '@chakra-ui/react/anatomy';

export const ontimeSwitchRecipe = defineSlotRecipe({
  slots: switchAnatomy.keys(),
  base: {
    root: {
      fontSize: 'sm',
    },
    thumb: {
      backgroundColor: '#f6f6f6 !important', // $ui-white
      border: '2px solid transparent',
    },
    control: {
      backgroundColor: '#2d2d2d !important',
      _checked: {
        backgroundColor: '#2B5ABC !important', // $blue-700,
      },
      _focus: {
        outline: '2px solid #578AF4', // $blue-500
      },
      _focusVisible: {
        outline: '2px solid #578AF4 !important', // $blue-500
      },
      _active: {
        outline: '2px solid #578AF4', // $blue-500
      },
    },
  },
});
