import { defineSlotRecipe } from '@chakra-ui/react';
import { switchAnatomy } from '@chakra-ui/react/anatomy';

export const ontimeSwitchRecipe = defineSlotRecipe({
  slots: switchAnatomy.keys(),
  base: {
    thumb: {
      outline: '1px solid transparent',
    },
    control: {
      background: '#2d2d2d', // $gray-1100
      _checked: {
        background: '#2B5ABC', // $blue-700
      },
      _focus: {
        outline: '1px solid #578AF4', // $blue-500
      },
    },
  },
});
