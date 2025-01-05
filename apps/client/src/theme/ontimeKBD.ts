import { defineRecipe } from '@chakra-ui/react';

export const ontimeKBDRecipe = defineRecipe({
  base: {
    borderRadius: '2px',
    border: 'none',
    backgroundColor: '#262626', // $gray-1200
    padding: '0.125rem 0.5rem',
    color: '#f6f6f6', // $ui-white
    fontWeight: 400,
    boxShadow: '0px 0px 3px 0px rgba(0,0,0,0.4)',
    fontSize: 'calc(1rem - 2px)',
  },
});
