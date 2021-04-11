import { serverURL } from './apiConstants';
export const eventsURL = serverURL + 'events';

export const fetchAllEvents = async () => {
  const res = await fetch(eventsURL);
  // TODO: Safe json convert
  return res.json();
};