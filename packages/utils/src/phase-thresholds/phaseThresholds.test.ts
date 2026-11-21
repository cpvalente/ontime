import type { PhaseThresholds } from 'ontime-types';

import { maxDuration } from '../date-utils/conversionUtils.js';
import {
  formatPhaseThreshold,
  parsePhaseOverride,
  parsePhaseThresholdInput,
  parsePhaseThreshold,
  parsePhaseThresholds,
  parsePhaseTimeInput,
  resolvePhaseThresholds,
} from './phaseThresholds.js';

const project: PhaseThresholds = {
  warning: { unit: 'time', value: 120000 },
  danger: { unit: 'time', value: 60000 },
};

const percent: PhaseThresholds = {
  warning: { unit: 'percent', value: 20 },
  danger: { unit: 'percent', value: 5 },
};

describe('resolvePhaseThresholds()', () => {
  it('uses the project thresholds when the event has none', () => {
    const event = { timeWarning: null, timeDanger: null, duration: 600000 };
    expect(resolvePhaseThresholds(event, project)).toStrictEqual({ timeWarning: 120000, timeDanger: 60000 });
  });

  it('takes a percentage of the event duration', () => {
    const event = { timeWarning: null, timeDanger: null, duration: 600000 };
    expect(resolvePhaseThresholds(event, percent)).toStrictEqual({ timeWarning: 120000, timeDanger: 30000 });
  });

  it('uses each event value over the project one', () => {
    const event = { timeWarning: 300000, timeDanger: null, duration: 600000 };
    expect(resolvePhaseThresholds(event, percent)).toStrictEqual({ timeWarning: 300000, timeDanger: 30000 });
  });

  it('keeps an event value of zero, which disables the phase', () => {
    const event = { timeWarning: 0, timeDanger: 0, duration: 600000 };
    expect(resolvePhaseThresholds(event, percent)).toStrictEqual({ timeWarning: 0, timeDanger: 0 });
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

describe('parsePhaseThresholdInput()', () => {
  it.each([
    ['20%', { unit: 'percent', value: 20 }],
    [' 12.5 % ', { unit: 'percent', value: 12.5 }],
    ['7,5%', { unit: 'percent', value: 7.5 }],
    ['150%', { unit: 'percent', value: 100 }],
    ['2m', { unit: 'time', value: 120000 }],
    ['00:01:30', { unit: 'time', value: 90000 }],
    ['0', { unit: 'time', value: 0 }],
    ['', null],
    ['%', null],
    ['-5%', null],
    ['2m%', null],
    ['abc', null],
    ['-2m', null],
    ['abc1', null],
    ['1x', null],
    ['m5', null],
  ])('parses %j as %j', (text, expected) => {
    expect(parsePhaseThresholdInput(text)).toStrictEqual(expected);
  });
});

describe('parsePhaseTimeInput()', () => {
  it.each([
    ['2m', 120000],
    ['1h30', 5400000],
    ['00:01:30', 90000],
    ['20%', null],
    ['n/a', null],
    ['', null],
  ])('parses %j as %j', (text, expected) => {
    expect(parsePhaseTimeInput(text)).toBe(expected);
  });
});

describe('formatPhaseThreshold()', () => {
  it('shows a percentage with its sign and a time as a duration', () => {
    expect(formatPhaseThreshold({ unit: 'percent', value: 20 })).toBe('20%');
    expect(formatPhaseThreshold({ unit: 'time', value: 120000 })).toBe('00:02:00');
  });
});
