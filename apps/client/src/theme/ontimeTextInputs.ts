const commonStyles = {
  fontWeight: '400',
  backgroundColor: '#262626', // $gray-1200
  color: '#e2e2e2', // $gray-200
  border: '1px solid transparent',
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

export const ontimeInputFilled = {
  field: {
    ...commonStyles,
  },
};

export const ontimeInputFilledOnLight = {
  field: {
    backgroundColor: 'white',
    border: '2px solid #f6f6f6', // $gray-50
    _hover: {
      border: '2px solid #D2DDFF', // $blue-200
    },
    _focus: {
      border: '2px solid #578AF4', // $blue-500
    },
    _disabled: {
      _hover: {
        backgroundColor: 'white',
      },
    },
  },
};

export const ontimeTextAreaFilled = {
  ...commonStyles,
};
export const ontimeTextAreaTransparent = {
  ...commonStyles,
  backgroundColor: 'transparent',
  _hover: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)', // $white-10
  },
};

export const ontimeTextAreaFilledOnLight = {
  borderRadius: '3px',
  fontWeight: '400',
  backgroundColor: 'white',
  color: '#202020', // $gray-1200
  border: '2px solid #f6f6f6', // $gray-50
  _hover: {
    border: '2px solid #D2DDFF', // $blue-200
  },
  _focus: {
    color: '#101010',
    border: '2px solid #578AF4', // $blue-500
  },
  _placeholder: { color: '#9d9d9d' }, // $gray-500
  _disabled: {
    _hover: {
      backgroundColor: 'white',
    },
  },
};
