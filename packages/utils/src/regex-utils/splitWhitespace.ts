// const parseRegex = /[\w.]+|"(?:\\"|[^"])+"/g;
const splitRegex = /\\?.|^$/g;

/**
 * [link](https://stackoverflow.com/questions/4031900/split-a-string-by-whitespace-keeping-quoted-segments-allowing-escaped-quotes)
 * @param str string to split
 * @returns
 */
export const splitWhitespace = (str: string, keepQuotes = true): null | string[] => {
  const match = str.match(splitRegex);
  if (!match || match[0] == '') {
    return null;
  }
  const { array } = match.reduce(
    (accumulator, current) => {
      if (current === '"') {
        accumulator.inQuotes ^= 1;
        if (keepQuotes) {
          accumulator.array[accumulator.array.length - 1] += current.replace(/\\(.)/, '$1');
        }
      } else if (!accumulator.inQuotes && current === ' ') {
        accumulator.array.push('');
      } else {
        accumulator.array[accumulator.array.length - 1] += current.replace(/\\(.)/, '$1');
      }
      return accumulator;
    },
    { array: [''], inQuotes: 0 },
  );

  return array;
};
// export const splitWhitespace = (str: string): null | string[] => str.match(parseRegex);
