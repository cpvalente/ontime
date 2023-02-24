import axios from 'axios';
import { EventData } from 'ontime-types';

import { eventURL } from './apiConstants';

/**
 * @description HTTP request to fetch event data
 * @return {Promise}
 */
export async function fetchEvent(): Promise<EventData> {
  const res = await axios.get(eventURL);
  return res.data;
}

/**
 * @description HTTP request to mutate event data
 * @return {Promise}
 */
export async function postEvent(data: EventData) {
  return axios.post(eventURL, data);
}
