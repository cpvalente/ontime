/**
 * @description Validates two time entries
 * @param {number} timeStart
 * @param {number} timeEnd
 * @returns {{catch: string, value: boolean}}
 */
export const validateTimes = (timeStart, timeEnd) => {
  const validate = { value: true, catch: '' };
  if (timeStart > timeEnd) {
    validate.catch = 'Start time later than end time';
  }
  return validate;
};
