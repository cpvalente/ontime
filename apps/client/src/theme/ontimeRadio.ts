import { defineSlotRecipe } from '@chakra-ui/react';
import { radioGroupAnatomy } from '@chakra-ui/react/anatomy';

export const ontimeRadioGroupRecipe = defineSlotRecipe({
  slots: radioGroupAnatomy.keys(),
  base: {
    root: {
      '& .dot': {
        display: 'none',
      },
    },
    item: {
      cursor: 'pointer',
    },
    itemControl: {
      cursor: 'pointer',
      border: '2px solid #262626 !important', // $gray-1200
      backgroundColor: '#262626', // $gray-1200
      _checked: {
        backgroundColor: '#3182ce !important', // $action-blue,
        _hover: {
          border: '3px solid #2b6cb0 !important', // $gray-1200
        },
      },
      _hover: {
        color: '#3182ce !important!', // $action-blue
        backgroundColor: '#3182ce !important', // $action-blue,
      },
    },
    itemText: {
      fontSize: '0.8em',
      letterSpacing: '0.3px',
      color: '#9d9d9d', // $gray-500
      _checked: {
        color: '#cfcfcf', // $gray-300
      },
      _hover: {
        color: '#e2e2e2', // $gray-200
      },
    },
  },
});
