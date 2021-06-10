export const stringFromMillis = (
  ms,
  showSeconds = true,
  delim = ':',
  ifNull = '...'
) => {
  if (ms === null || isNaN(ms)) return ifNull;
  const showWith0 = (value) => (value < 10 ? `0${value}` : value);
  const hours = showWith0(Math.floor(((ms / (1000 * 60 * 60)) % 60) % 24));
  const minutes = showWith0(Math.floor((ms / (1000 * 60)) % 60));
  const seconds = showWith0(Math.floor((ms / 1000) % 60));

  return showSeconds
    ? `${
        parseInt(hours) ? `${hours}${delim}` : `00${delim}`
      }${minutes}${delim}${seconds}`
    : `${parseInt(hours) ? `${hours}` : '00'}${delim}${minutes}`;
};
