import { Settings } from 'ontime-types';
import { defaultPhaseThresholds } from 'ontime-utils';

import { appVersion } from '../../externals';

export const ontimePlaceholderSettings: Settings = {
  version: appVersion,
  editorKey: null,
  operatorKey: null,
  timeFormat: '24',
  language: 'en',
  auxTimerNames: ['', '', ''],
  phaseThresholds: defaultPhaseThresholds,
};
