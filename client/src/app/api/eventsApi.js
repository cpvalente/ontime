import { serverURL } from './apiConstants';
export const eventsURL = serverURL + 'events/';

export const fetchAllEvents = async () => {
  const res = await fetch(eventsURL + 'all');
  // TODO: Safe json convert
  return res.json();
};