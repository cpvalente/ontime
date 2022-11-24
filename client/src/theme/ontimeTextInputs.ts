const commonStyles = {
  borderRadius: '3px',
  fontWeight: '400',
  background: '#2d2d2d',  // $gray-1100
  color: '#9d9d9d', // $gray-500
  border: '1px solid transparent',
  _hover: {
    background: '#404040', // $gray-1000
  },
  _focus: {
    background: '#404040', // $gray-1000
    color: '#f6f6f6', // $gray-50
    border: '1px solid #578AF4', // $blue-500
  },
};

export const ontimeInputFilled = {
  field: {
    ...commonStyles,
  },
};

export const ontimeTextAreaFilled = {
  ...commonStyles,
};
