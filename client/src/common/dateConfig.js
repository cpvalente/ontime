import { addMinutes, format, parseISO } from 'date-fns';

export const timeFormat = 'HH:mm';
export const timeFormatSeconds = 'HH:mm:ss';

// make date with string
export const timeToDate = (time) => {
  const today = new Date();
  return new Date(today.toDateString() + ' ' + time);
};

// utility to parse and format
export const dateToTime = (time) => {
  const fTime = parseISO(time, 1);
  return format(fTime, timeFormat);
};

// small shorthand for adding delay and formatting date
export const addAndFormat = (time, delay) => {
  const fTime = parseISO(time, 1);
  return format(addMinutes(fTime, delay), timeFormat);
};
