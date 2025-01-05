import { defineSlotRecipe } from '@chakra-ui/react';
import { radioGroupAnatomy } from '@chakra-ui/react/anatomy';

export const ontimeRadioGroupRecipe = defineSlotRecipe({
  slots: radioGroupAnatomy.keys(),
  base: {
    itemControl: {
      borderColor: '#262626', // $gray-1200
      backgroundColor: '#262626', // $gray-1200
      _checked: {
        borderColor: '#262626', // $gray-1200
        color: '#3182ce', // $action-blue
        backgroundColor: '#3182ce', // $action-blue
      },
      _hover: {
        color: '#3182ce', // $action-blue
        backgroundColor: '#3182ce', // $action-blue
        outline: 'none',
      },
    },
    label: {
      fontSize: '0.7em',
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
