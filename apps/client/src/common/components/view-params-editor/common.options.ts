import type { ParamField } from './viewParams.types';

export const getTimeOption = (timeFormat: string): ParamField => {
  const placeholder = `${timeFormat} (default)`;
  return {
    id: 'timeformat',
    title: 'Clock time format, defaults to value from the Settings',
    description: 'Format for the Time Now field, eg. HH:mm:ss or hh:mm:ss a, see docs for help',
    type: 'string',
    placeholder,
  };
};

export const hideTimerSeconds: ParamField = {
  id: 'hideTimerSeconds',
  title: 'Hide seconds in timer',
  description: 'Whether to hide seconds in the running timer',
  type: 'boolean',
  defaultValue: false,
};

export const showLeadingZeros: ParamField = {
  id: 'showLeadingZeros',
  title: 'Show leading zeros in timer',
  description: 'Whether to show leading zeros in the running timer',
  type: 'boolean',
  defaultValue: false,
};
