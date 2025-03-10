export const ontimeButtonFilled = {
  background: '#2B5ABC', // $blue-700
  color: '#fff', // pure-white
  border: '1px solid #2B5ABC', // $blue-700
  _hover: {
    backgroundColor: '#0A43B9', // $blue-800
    border: '1px solid #0A43B9', // $blue-800
    _disabled: {
      background: '#2B5ABC', // $blue-700
    },
  },
  _active: {
    backgroundColor: '#0036A6', // blue-900
    borderColor: '#002A90', // blue-1000
  },
};

export const ontimeButtonOutlined = {
  backgroundColor: '#2d2d2d', // $gray-1100
  color: '#e2e2e2', // $gray-200
  border: '1px solid rgba(255, 255, 255, 0.10)', // white-10
  _hover: {
    backgroundColor: '#404040', // $gray-1000
    _disabled: {
      backgroundColor: '#2d2d2d', // $gray-1100
    },
  },
  _active: {
    backgroundColor: '#2d2d2d', // $gray-1100
    borderColor: '#202020', // $gray-1250
  },
};

export const ontimeButtonSubtle = {
  backgroundColor: '#303030', // $gray-1050
  color: '#779BE7', // $blue-400
  border: '1px solid transparent',
  _hover: {
    background: '#404040', // $gray-1000
    _disabled: {
      backgroundColor: '#303030', // $gray-1050
    },
  },
  _active: {
    backgroundColor: '#2d2d2d', // $gray-1100
    borderColor: '#202020', // $gray-1250
  },
};

// TODO: revise colours
export const ontimeButtonGhostedWhite = {
  ...ontimeButtonSubtle,
  backgroundColor: 'transparent',
  color: 'white',
  _hover: {
    background: '#404040', // $gray-1000
  },
  _active: {
    background: '#2d2d2d', // $gray-1100
  },
};

export const ontimeButtonGhosted = {
  ...ontimeButtonSubtle,
  backgroundColor: 'transparent',
  _hover: {
    background: '#404040', // $gray-1000
    _disabled: {
      backgroundColor: 'transparent',
    },
  },
};

export const ontimeButtonSubtleWhite = {
  ...ontimeButtonSubtle,
  color: '#f6f6f6', // $gray-50
};
