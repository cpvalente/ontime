const commonStyles = {
  letterSpacing: '0.3px',
  fontWeight: '400',
  borderRadius: '3px',
};

export const ontimeButtonFilled = {
  ...commonStyles,
  background: '#2B5ABC', // $blue-700
  color: '#fff', // pure-white
  border: '1px solid #2B5ABC', // $blue-700
  _hover: {
    backgroundColor: '#0A43B9', // $blue-800
    border: '1px solid #0A43B9', // $blue-800
  },
  _active: {
    backgroundColor: '#0036A6', // blue-900
    borderColor: '#002A90', // blue-1000
  },
};

export const ontimeButtonOutlined = {
  ...commonStyles,
  backgroundColor: '#2d2d2d', // $gray-1100
  color: '#779BE7', // $blue-400
  border: '1px solid #779BE7', // $blue-400
  _hover: {
    backgroundColor: '#404040', // $gray-1000
  },
  _active: {
    backgroundColor: '#2d2d2d', // $gray-1100
    borderColor: '#202020', // $gray-12000
  },
};

export const ontimeButtonSubtle = {
  ...commonStyles,
  backgroundColor: '#303030', // $gray-1050
  color: '#779BE7', // $blue-400
  border: '1px solid transparent',
  _hover: {
    background: '#404040', // $gray-1000
  },
  _active: {
    backgroundColor: '#2d2d2d', // $gray-1100
    borderColor: '#202020', // $gray-12000
  },
};

export const ontimeButtonSubtleWhite = {
  ...ontimeButtonSubtle,
  color: '#f6f6f6', // $gray-50
};
