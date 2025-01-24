import { CustomFields } from 'ontime-types';

import type { ParamField } from './types';

export const makeOptionsFromCustomFields = (
  customFields: CustomFields,
  additionalOptions: Record<string, string> = {},
) => {
  return Object.entries(customFields).reduce((options, [key, value]) => {
    options[`custom-${key}`] = `Custom: ${value.label}`;
    return options;
  }, additionalOptions);
};

export const getTimeOption = (timeFormat: string): ParamField => {
  const placeholder = `${timeFormat} (default)`;
  return {
    id: 'timeformat',
    title: 'Time format string, taken from the Application Settings',
    description: 'Format for auxiliar time fields (not the running), eg. HH:mm:ss or hh:mm:ss a, see docs for help',
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

export enum OptionTitle {
  ClockOptions = 'Clock Options',
  TimerOptions = 'Timer Options',
  DataSources = 'Data sources',
  ElementVisibility = 'Element visibility',
  BehaviourOptions = 'View behaviour',
  StyleOverride = 'View style override',
  Animation = 'View animation',
  Schedule = 'Schedule options',
}
