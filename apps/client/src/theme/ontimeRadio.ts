export const ontimeRadio = {
  container: {
    backgroundColor: '#262626', // $gray-1200
    padding: '0.5em',
    borderRadius: '3px',
    _hover: {
      background: '#404040', // $gray-1000
    },
    _checked: {
      background: '#3E75E8', //blue-600
    },
  },
  control: {
    borderColor: '#101010', // $ui-black
    backgroundColor: '#101010', // $ui-black
    _checked: {
      borderColor: '#262626', // $gray-1200
      color: '#f6f6f6', // $ui-white
      backgroundColor: '#f6f6f6', // $ui-white
    },
  },
  label: {
    color: '#9d9d9d', // $gray-500, same as placeholder value
    _checked: {
      color: '#f6f6f6', // $gray-200
    },
    _hover: {
      color: '#e2e2e2', // $gray-200
    },
  },
};

export const ontimeBlockRadio = {
  control: {
    borderColor: '#262626', // $gray-1200
    backgroundColor: '#262626', // $gray-1200
    _checked: {
      borderColor: '#262626', // $gray-1200
      color: '#3182ce', // $action-blue
      backgroundColor: '#3182ce', // $action-blue
    },
    _hover: {
      color: '#3182ce', // $action-blue
      backgroundColor: '#3182ce', // $action-blue
      outline: 'none',
    },
  },
  label: {
    fontSize: '0.7em',
    letterSpacing: '0.3px',
    color: '#9d9d9d', // $gray-500
    _checked: {
      color: '#cfcfcf', // $gray-300
    },
    _hover: {
      color: '#e2e2e2', // $gray-200
    },
  },
};
