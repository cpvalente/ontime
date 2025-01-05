import { defineRecipe } from '@chakra-ui/react';

const commonStyles = {
  fontWeight: '400',
  backgroundColor: '#262626', // $gray-1200
  color: '#e2e2e2', // $gray-200
  border: '1px solid transparent',
  borderRadius: '3px',
  _hover: {
    backgroundColor: '#2d2d2d', // $gray-1100
  },
  _focus: {
    backgroundColor: '#2d2d2d', // $gray-1000
    color: '#f6f6f6', // $gray-50
    border: '1px solid #578AF4', // $blue-500
  },
  _placeholder: { color: '#9d9d9d' }, // $gray-500
  _disabled: {
    _hover: {
      backgroundColor: '#262626', // $gray-1200
    },
  },
};

const ontimeInputFilled = {
  ...commonStyles,
};

const ontimeInputGhosted = {
  ...commonStyles,
  backgroundColor: 'transparent',
  color: '#f6f6f6', // $gray-50
  _hover: {
    backgroundColor: 'transparent',
    border: '1px solid #2B5ABC', // $blue-500
  },
};

const ontimeInputTransparent = {
  ...commonStyles,
  backgroundColor: 'transparent',
  _hover: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)', // $white-10
  },
};

const ontimeTextAreaFilled = {
  ...commonStyles,
};

const ontimeTextAreaTransparent = {
  ...commonStyles,
  backgroundColor: 'transparent',
  _hover: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)', // $white-10
  },
};

export const ontimeTextareaRecipe = defineRecipe({
  base: {
    borderRadius: '3px',
    border: '1px',
  },
  variants: {
    variant: {
      'ontime-filled': { ...ontimeTextAreaFilled },
      'ontime-transparent': { ...ontimeTextAreaTransparent },
    },
  },
});

export const ontimeInputRecipe = defineRecipe({
  base: {
    borderRadius: '3px',
  },
  variants: {
    variant: {
      'ontime-filled': { ...ontimeInputFilled },
      'ontime-ghosted': { ...ontimeInputGhosted },
      'ontime-transparent': { ...ontimeInputTransparent },
    },
  },
});
