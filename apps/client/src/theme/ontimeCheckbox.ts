export const ontimeCheckboxOnDark = {
  control: {
    border: '1px',
    borderColor: '#2d2d2d', // $gray-1100
    backgroundColor: '#2d2d2d', // $gray-1100
    _disabled: {
      color: 'white',
      borderColor: '#2d2d2d', // $gray-1100
      backgroundColor: '#2d2d2d', // $gray-1100
      opacity: 0.6,
    },
    _checked: {
      borderColor: '#578AF4', // $blue-500
      backgroundColor: '#578AF4', // $blue-500
      _disabled: {
        color: 'white',
        borderColor: '#578AF4', // $blue-500
        backgroundColor: '#578AF4', // $blue-500
        opacity: 0.6,
      },
    },
    _focus: {
      boxShadow: 'none',
    },
  },
  label: {
    fontWeight: '200',
    color: '#9d9d9d', // $gray-500
    _checked: {
      color: '#cfcfcf', // $gray-300
    },
  },
};
