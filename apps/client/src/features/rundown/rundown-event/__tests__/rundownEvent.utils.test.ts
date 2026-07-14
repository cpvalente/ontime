import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE } from 'ontime-utils';

import { formatDelay } from '../rundownEvent.utils';

describe('formatDelay()', () => {
  it('adds a given delay to the start time', () => {
    const timeStart = 1 * MILLIS_PER_MINUTE; // 00:01
    const delay = 1 * MILLIS_PER_MINUTE; // 00:01
    const result = formatDelay(timeStart, delay);
    expect(result).toEqual('New start 00:02');
  });

  it('wraps negative delayed starts under midnight', () => {
    const timeStart = 1 * MILLIS_PER_MINUTE; // 00:01
    const delay = -2 * MILLIS_PER_MINUTE; // -00:02
    const result = formatDelay(timeStart, delay);
    expect(result).toEqual('New start 23:59');
  });

  it('wraps later-day negative delays using delay as the source of truth', () => {
    const timeStart = 1 * MILLIS_PER_HOUR; // 01:00
    const delay = -(1 * MILLIS_PER_HOUR + 30 * MILLIS_PER_MINUTE); // -01:30
    const result = formatDelay(timeStart, delay);
    expect(result).toEqual('New start 23:30');
  });

  it('displays positive delays as wall-clock time', () => {
    const timeStart = 1 * MILLIS_PER_HOUR; // 01:00
    const delay = 1 * MILLIS_PER_HOUR + 30 * MILLIS_PER_MINUTE; // 01:30
    const result = formatDelay(timeStart, delay);
    expect(result).toEqual('New start 02:30');
  });
});
