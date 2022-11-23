const commonStyles = {
  letterSpacing: '0.3px',
  fontWeight: '400',
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
  background: 'rgba(255, 255, 255, 0.07)', // $white-7
  color: '#779BE7', // $blue-400
  border: '1px solid #779BE7', // $blue-400
  _hover: {
    background: 'rgba(255, 255, 255, 0.03)', // $white-3
    border: '1px solid #AFC4FF', // $blue-300
  },
};


export const ontimeButtonSubtle = {
  ...commonStyles,
  background: 'rgba(255, 255, 255, 0.07)', // $white-7
  color: '#779BE7', // $blue-400
  border: '1px solid transparent',
  _hover: {
    background: 'rgba(255, 255, 255, 0.13)', // $white-11
  },
};

