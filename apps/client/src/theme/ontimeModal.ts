import { defineSlotRecipe } from '@chakra-ui/react';
import { dialogAnatomy } from '@chakra-ui/react/anatomy';

export const ontimeDialogRecipe = defineSlotRecipe({
  slots: dialogAnatomy.keys(),
  base: {
    backdrop: {
      background: 'rgba(0, 0, 0, 0.5)',
    },
    header: {
      fontWeight: 400,
      letterSpacing: '0.3px',
      padding: '1rem 1.5rem',
      fontSize: '1.25rem',
      color: '#fefefe', // $gray-50
    },
    content: {
      borderRadius: '3px',
      padding: 0,
      minHeight: 'min(200px, 10vh)',
      backgroundColor: '#202020', // $gray-1250
      color: '#fefefe', // $gray-50
      border: '1px solid #2d2d2d', // $gray-1100
    },
    body: {
      padding: '1rem',
      fontSize: 'calc(1rem - 2px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    closeTrigger: {
      color: '#fefefe', // $gray-50
    },
    footer: {
      padding: '1rem',
      display: 'flex',
      gap: '0.5rem',
    },
  },
});
