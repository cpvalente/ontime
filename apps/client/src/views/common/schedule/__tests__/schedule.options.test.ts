import { describe, expect, it } from 'vitest';

import { getScheduleOptionsFromParams } from '../schedule.options';

describe('getScheduleOptionsFromParams()', () => {
  it('reads options from the URL params', () => {
    const searchParams = new URLSearchParams('filter=room&cycleInterval=5&stopCycle=true&showExpected=true');
    expect(getScheduleOptionsFromParams(searchParams)).toStrictEqual({
      filter: 'room',
      cycleInterval: 5,
      stopCycle: true,
      showExpected: true,
    });
  });

  it('falls back to defaults when nothing is set', () => {
    expect(getScheduleOptionsFromParams(new URLSearchParams())).toStrictEqual({
      filter: null,
      cycleInterval: 10,
      stopCycle: false,
      showExpected: false,
    });
  });

  it('prioritises preset values over URL params', () => {
    const searchParams = new URLSearchParams('filter=room&cycleInterval=5');
    const preset = new URLSearchParams('filter=stage&cycleInterval=20&stopCycle=true&showExpected=true');
    expect(getScheduleOptionsFromParams(searchParams, preset)).toStrictEqual({
      filter: 'stage',
      cycleInterval: 20,
      stopCycle: true,
      showExpected: true,
    });
  });
});
