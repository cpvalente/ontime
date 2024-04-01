export const ontimeMenuOnDark = {
  list: {
    fontSize: 'calc(1rem - 2px)',
    borderRadius: '3px',
    borderColor: '#b1b1b1', // $gray-400
    color: '#ececec', // $gray-1030
    backgroundColor: '#202020', // $gray-1250
    zIndex: 100,
  },
  item: {
    backgroundColor: '#202020', // $gray-1250
    _hover: {
      backgroundColor: '#101010', // $gray-1350
      _disabled: {
        backgroundColor: '#202020', // $gray-1250
      },
    },
    _disabled: {
      color: '#b1b1b1', // $gray-400
    },
  },
  divider: {
    borderColor: '#b1b1b1', // $gray-400
  },
};
