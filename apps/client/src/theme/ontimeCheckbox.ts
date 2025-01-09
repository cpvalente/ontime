import { defineSlotRecipe } from '@chakra-ui/react';
import { checkboxAnatomy } from '@chakra-ui/react/anatomy';

export const ontimeCheckboxRecipe = defineSlotRecipe({
  slots: checkboxAnatomy.keys(),
  base: {
    root: {
      fontSize: 'sm',
      cursor: 'pointer',
    },
    control: {
      border: '1px solid #2d2d2d !important', // $gray-1100
      backgroundColor: '#2d2d2d', // $gray-1100
      _disabled: {
        color: 'white',
        borderColor: '#2d2d2d !important', // $gray-1100
        backgroundColor: '#2d2d2d !important', // $gray-1100
        opacity: 0.6,
      },
      _checked: {
        border: '1px solid #3182ce !important', // $action-blue
        color: '#fff !important',
        backgroundColor: '#3182ce !important', //$action-blue
        _disabled: {
          color: 'white',
          borderColor: '#3182ce !important', // $action-blue
          backgroundColor: '#3182ce !important', //$action-blue
          opacity: 0.6,
        },
      },
      _focus: {
        boxShadow: 'none',
      },
    },
    label: {
      fontWeight: '200',
      color: '#9d9d9d !important', // $gray-500
      _checked: {
        color: '#cfcfcf !important', // $gray-300
      },
    },
  },
});
