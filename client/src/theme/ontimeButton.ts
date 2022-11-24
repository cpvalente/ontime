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
    background: '#0A43B9', // $blue-800
    border: '1px solid #0A43B9', // $blue-800
  },
};

export const ontimeButtonOutlined = {
  ...commonStyles,
  background: '#2d2d2d', // $gray-1100
  color: '#779BE7', // $blue-400
  border: '1px solid #779BE7', // $blue-400
  _hover: {
    background: '#404040', // $gray-1000
  },
};

export const ontimeButtonSubtle = {
  ...commonStyles,
  background: '#2d2d2d', // $gray-1100
  color: '#779BE7', // $blue-400
  border: '1px solid transparent',
  _hover: {
    background: '#404040', // $gray-1000
  },
};
