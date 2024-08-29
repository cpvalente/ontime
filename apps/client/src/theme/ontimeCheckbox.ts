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
      borderColor: '#3182ce', // $action-blue
      backgroundColor: '#3182ce', //$action-blue
      _disabled: {
        color: 'white',
        borderColor: '#3182ce', // $action-blue
        backgroundColor: '#3182ce', //$action-blue
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

export const ontimeCheckboxWhite = {
  control: {
    border: '1px',
    borderColor: '#b1b1b1', // $gray-400
    backgroundColor: '#0000',
    _disabled: {
      color: 'white',
      borderColor: '#2d2d2d', // $gray-1100
      backgroundColor: '#2d2d2d', // $gray-1100
      opacity: 0.6,
    },
    _checked: {
      borderColor: '#3182ce', // $action-blue
      backgroundColor: '#3182ce', //$action-blue
      _disabled: {
        color: 'white',
        borderColor: '#3182ce', // $action-blue
        backgroundColor: '#3182ce', //$action-blue
        opacity: 0.6,
      },
    },
    _focus: {
      boxShadow: 'none',
    },
  },
  label: {
    // fontWeight: '200',
    color: '#f6f6f6', // $ui-white: $gray-50;
    _checked: {
      color: '#f6f6f6', // $ui-white: $gray-50;
    },
  },
};
