
export const timeFormat = 'HH:mm';
export const timeFormatSeconds = 'HH:mm:ss';

// time string from miliseconds
export const stringFromMillis = (
  ms,
  showSeconds = true,
  delim = ':',
  ifNull = '...'
) => {
  if (ms === null) return ifNull;
  const showWith0 = (value) => (value < 10 ? `0${value}` : value);
  const hours = showWith0(Math.floor((ms / (1000 * 60 * 60)) % 60));
  const minutes = showWith0(Math.floor((ms / (1000 * 60)) % 60));
  const seconds = showWith0(Math.floor((ms / 1000) % 60));
  return showSeconds
    ? `${parseInt(hours) ? `${hours}${delim}` : ''}${minutes}${delim}${seconds}`
    : `${parseInt(hours) ? `${hours}${delim}` : ''}${minutes}`;
};

// millis to seconds
export const millisToSeconds = (millis) => {
  return Math.floor(millis / 1000);
};

// millis to minutes
export const millisToMinutes = (millis) => {
  return Math.floor(millis / 60000);
};

// timeStringToMillis
export const timeStringToMillis = (string) => {
  let time = string.split(':');
  return time[0] * 3600000 + time[1] * 60000;
};
