export const ontimeMenuOnDark = {
  list: {
    fontSize: 'calc(1rem - 2px)',
    borderRadius: '3px',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ececec', // $gray-1030
    backgroundColor: '#202020', // $gray-1250
    zIndex: 100,
  },
  item: {
    backgroundColor: 'transparent',
    paddingBlock: '0.5rem',
    _hover: {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      _disabled: {
        backgroundColor: 'transparent',
      },
    },
    _disabled: {
      color: '#b1b1b1', // $gray-400
    },
  },
  divider: {
    borderColor: 'rgba(255, 255, 255, 0.07)',
    opacity: 1,
  },
};
