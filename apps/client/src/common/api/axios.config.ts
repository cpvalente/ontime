import axios from 'axios';

axios.defaults.validateStatus = (status) => {
  return (status >= 200 && status < 300) || status === 304;
};
