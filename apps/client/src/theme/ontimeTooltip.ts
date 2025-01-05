import { defineSlotRecipe } from '@chakra-ui/react';
import { tooltipAnatomy } from '@chakra-ui/react/anatomy';

export const ontimeTooltipRecipe = defineSlotRecipe({
  slots: tooltipAnatomy.keys(),
  base: {
    content: {
      backgroundColor: '#2d2d2d', // $gray-1100
      color: '#ececec', // $gray-100
      padding: '2px 8px',
    },
  },
});
