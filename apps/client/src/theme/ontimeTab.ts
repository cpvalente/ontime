import { defineSlotRecipe } from '@chakra-ui/react';
import { tabsAnatomy } from '@chakra-ui/react/anatomy';

export const ontimeTabRecipe = defineSlotRecipe({
  slots: tabsAnatomy.keys(),
  base: {
    list: {
      fontWeight: 600,
      borderBottom: '2px solid transparent',
      color: '#9d9d9d', // $gray-500
      marginBottom: '-2px',
      _selected: {
        color: '#101010', // $ui-black
        border: 'none',
        borderBottom: '2px solid #779BE7', // $blue-400
      },
    },
    contentGroup: {
      borderBottom: '2px solid #ececec', // $gray-100
    },
    content: {
      padding: 0,
    },
  },
});
