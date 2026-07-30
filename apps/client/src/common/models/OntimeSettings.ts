import { Settings } from 'ontime-types';
import { normaliseAuxTimerNames } from 'ontime-utils';

export const ontimePlaceholderSettings: Settings = {
  version: '4.0.0',
  editorKey: null,
  operatorKey: null,
  timeFormat: '24',
  language: 'en',
  auxTimerNames: normaliseAuxTimerNames(),
};
