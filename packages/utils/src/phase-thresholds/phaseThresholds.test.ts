import type { PhaseThresholds } from 'ontime-types';

import { maxDuration } from '../date-utils/conversionUtils.js';
import {
  parsePhaseOverride,
  parsePhaseThreshold,
  parsePhaseThresholds,
  resolvePhaseThresholds,
} from './phaseThresholds.js';

const project: PhaseThresholds = {
  warning: { unit: 'time', value: 120000 },
  danger: { unit: 'time', value: 60000 },
};

const group: PhaseThresholds = {
  warning: { unit: 'percent', value: 20 },
  danger: { unit: 'percent', value: 5 },
};

describe('resolvePhaseThresholds()', () => {
  it('uses the project thresholds when nothing overrides them', () => {
    const event = { timeWarning: null, timeDanger: null, duration: 600000 };
    expect(resolvePhaseThresholds(event, null, project)).toStrictEqual({ timeWarning: 120000, timeDanger: 60000 });
  });

  it('uses the group thresholds over the project, as a share of the event duration', () => {
    const event = { timeWarning: null, timeDanger: null, duration: 600000 };
    expect(resolvePhaseThresholds(event, group, project)).toStrictEqual({ timeWarning: 120000, timeDanger: 30000 });
  });

  it('uses each event value over the inherited one', () => {
    const event = { timeWarning: 300000, timeDanger: null, duration: 600000 };
    expect(resolvePhaseThresholds(event, group, project)).toStrictEqual({ timeWarning: 300000, timeDanger: 30000 });
  });

  it('keeps an event value of zero, which disables the phase', () => {
    const event = { timeWarning: 0, timeDanger: 0, duration: 600000 };
    expect(resolvePhaseThresholds(event, group, project)).toStrictEqual({ timeWarning: 0, timeDanger: 0 });
  });
});

describe('parsePhaseThreshold()', () => {
  it.each([
    [
      { unit: 'time', value: 1e15 },
      { unit: 'time', value: maxDuration },
    ],
    [
      { unit: 'percent', value: 150 },
      { unit: 'percent', value: 100 },
    ],
    [{ unit: 'time', value: -1 }, null],
    [{ unit: 'frames', value: 10 }, null],
  ])('parses %j as %j', (value, expected) => {
    expect(parsePhaseThreshold(value)).toStrictEqual(expected);
  });
});

describe('parsePhaseThresholds()', () => {
  it('needs both thresholds', () => {
    expect(parsePhaseThresholds(project)).toStrictEqual(project);
    expect(parsePhaseThresholds({ warning: project.warning })).toBeNull();
  });
});

describe('parsePhaseOverride()', () => {
  it.each([
    [undefined, 1000, 1000],
    [null, 1000, null],
    ['', 1000, null],
    [0, 1000, 0],
    [-1, 1000, 1000],
  ])('parses %j with fallback %j as %j', (value, fallback, expected) => {
    expect(parsePhaseOverride(value, fallback)).toBe(expected);
  });
});
