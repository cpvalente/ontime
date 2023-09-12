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
  color: '#e2e2e2', // $blue-400
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

export const ontimeButtonGhosted = {
  ...ontimeButtonSubtle,
  backgroundColor: 'transparent',
};

export const ontimeButtonSubtleOnLight = {
  backgroundColor: '#ececec', // $gray-100
  color: '#595959', // $gray-800
  border: '1px solid transparent',
  _hover: {
    backgroundColor: '#cfcfcf', // $gray-200
    _disabled: {
      backgroundColor: '#ececec', // $gray-100
    },
  },
  _active: {
    backgroundColor: '#ececec', // $gray-200
    borderColor: '#ececec', // $gray-300
  },
};

export const ontimeGhostOnLight = {
  backgroundColor: 'transparent',
  color: '#595959', // $gray-800
  _hover: {
    color: '#595959', // $gray-800
    backgroundColor: '#ececec', // $gray-200
    _disabled: {
      backgroundColor: 'transparent',
    },
  },
  _active: {
    backgroundColor: 'transparent',
    borderColor: '#595959', // $gray-800
  },
};

export const ontimeButtonSubtleWhite = {
  ...ontimeButtonSubtle,
  color: '#f6f6f6', // $gray-50
  fontWeight: 600,
};
