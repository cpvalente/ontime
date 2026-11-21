import type { QuickStartData } from 'ontime-types';
import { defaultPhaseThresholds } from 'ontime-utils';

export const quickStartDefaults: QuickStartData = {
  project: {
    title: '',
  },
  settings: {
    timeFormat: '24',
    language: 'en',
    phaseThresholds: defaultPhaseThresholds,
  },
};
