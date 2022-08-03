import axios from 'axios';

import { eventURL } from './apiConstants';

/**
 * @description HTTP request to fetch event data
 * @return {Promise}
 */
export const fetchEvent = async () => {
  const res = await axios.get(eventURL);
  return res.data;
};

/**
 * @description HTTP request to mutate event data
 * @return {Promise}
 */
export const postEvent = async (data) => axios.post(eventURL, data);
