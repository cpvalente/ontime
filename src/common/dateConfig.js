export const timeFormat = 'HH:mm';

 // make date with string
export const timeToDate = (time) => {
  const today = new Date();
  return new Date(today.toDateString() + ' ' + time);
};
