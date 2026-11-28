import type { ParamField } from './viewParams.types';

export const getTimeOption = (timeFormat: string): ParamField => {
  const placeholder = `${timeFormat} (default)`;
  return {
    id: 'timeformat',
    title: 'Time format',
    description: 'Overrides the format from settings, e.g. HH:mm:ss or hh:mm:ss a',
    type: 'string',
    placeholder,
  };
};

export const hideTimerSeconds: ParamField = {
  id: 'hideTimerSeconds',
  title: 'Hide seconds in timer',
  type: 'boolean',
  defaultValue: false,
};

export const showLeadingZeros: ParamField = {
  id: 'showLeadingZeros',
  title: 'Show leading zeros in timer',
  type: 'boolean',
  defaultValue: false,
};

export type TimeOptions = {
  timeformat: string | null;
};
