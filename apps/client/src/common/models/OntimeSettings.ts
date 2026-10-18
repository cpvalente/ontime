import { Settings } from 'ontime-types';

import { ONTIME_VERSION } from '../../ONTIME_VERSION';

export const ontimePlaceholderSettings: Settings = {
  version: ONTIME_VERSION,
  editorKey: null,
  operatorKey: null,
  timeFormat: '24',
  language: 'en',
  auxTimerNames: ['', '', ''],
};
