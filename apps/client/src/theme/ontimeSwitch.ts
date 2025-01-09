import { defineSlotRecipe } from '@chakra-ui/react';
import { switchAnatomy } from '@chakra-ui/react/anatomy';

export const ontimeSwitchRecipe = defineSlotRecipe({
  slots: switchAnatomy.keys(),
  base: {
    root: {
      fontSize: 'sm',
      '& > [data-state="unchecked"]': {
        backgroundColor: '#2d2d2d', // $gray-1100
      },
      _checked: {
        '& > [data-state="checked"]': {
          backgroundColor: '#2B5ABC', // $blue-700
        },
      },
      '& [data-part="thumb"]': {
        backgroundColor: '#fff !important',
      },
    },
    thumb: {
      border: '2px solid transparent',
    },
    control: {
      _focus: {
        outline: '2px solid #578AF4', // $blue-500
      },
    },
  },
});
