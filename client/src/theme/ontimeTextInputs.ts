const commonStyles = {
  borderRadius: '3px',
  fontWeight: '400',
  backgroundColor: '#2d2d2d',  // $gray-1100
  color: '#e2e2e2', // $gray-200
  border: '1px solid transparent',
  _hover: {
    backgroundColor: '#404040', // $gray-1000
  },
  _focus: {
    backgroundColor: '#404040', // $gray-1000
    color: '#f6f6f6', // $gray-50
    border: '1px solid #578AF4', // $blue-500
  },
  _placeholder: { color: '#9d9d9d' }, // $gray-500
};

export const ontimeInputFilled = {
  field: {
    ...commonStyles,
  },
};

export const ontimeTextAreaFilled = {
  ...commonStyles,
};
