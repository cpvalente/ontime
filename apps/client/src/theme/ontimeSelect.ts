export const ontimeSelect = {
  field: {
    color: '#e2e2e2', // $gray-200
    borderRadius: '3px',
    fontWeight: '400',
    background: '#262626', // $gray-1100
    border: '1px solid transparent',
    _hover: {
      background: '#404040', // $gray-1000
    },
    _focus: {
      background: '#404040', // $gray-1000
      color: '#f6f6f6', // $gray-50
      border: '1px solid #578AF4', // $blue-500
    },
    _disabled: {
      _hover: {
        background: '#262626', // $gray-1100
      },
    },
  },
  icon: {
    color: '#e2e2e2', // $gray-200
  },
};

export const ontimeSelectReadonly = {
  field: {
    ...ontimeSelect.field,
    backgroundColor: '#151515',
    border: '1px solid #9d9d9d',
  },
  icon: {
    height: '0px',
    width: '0px',
  },
};
