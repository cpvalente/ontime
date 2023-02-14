import axios from 'axios';

import { EventDataType } from '../models/EventData.type';

import { eventURL } from './apiConstants';

/**
 * @description HTTP request to fetch event data
 * @return {Promise}
 */
export async function fetchEvent(): Promise<EventDataType> {
  const res = await axios.get(eventURL);
  return res.data;
}

/**
 * @description HTTP request to mutate event data
 * @return {Promise}
 */
export async function postEvent(data: EventDataType) {
  return axios.post(eventURL, data);
}
