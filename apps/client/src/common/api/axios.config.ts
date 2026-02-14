import axios from 'axios';

import { axiosConfig } from './requestTimeouts';

axios.defaults.validateStatus = (status) => {
  return status >= 200 && status < 300;
};
axios.defaults.timeout = axiosConfig.shortTimeout;
