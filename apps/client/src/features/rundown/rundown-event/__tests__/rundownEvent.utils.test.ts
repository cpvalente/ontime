import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, createGroup } from 'ontime-utils';

import { formatDelay, getGroupDurationFit } from '../rundownEvent.utils';

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

describe('getGroupDurationFit()', () => {
  // duration is derived from the group entries, so createGroup does not accept it
  const makeGroup = (duration: number, targetDuration: number | null) => ({
    ...createGroup({ targetDuration }),
    duration,
  });

  it.each([
    { name: 'no group', group: null, expected: null },
    { name: 'a group without target', group: makeGroup(10, null), expected: null },
    { name: 'a group meeting its target', group: makeGroup(10, 10), expected: null },
    { name: 'a group under its target', group: makeGroup(10, 20), expected: 'increase' },
    { name: 'a group over its target', group: makeGroup(20, 10), expected: 'decrease' },
  ])('returns $expected for $name', ({ group, expected }) => {
    expect(getGroupDurationFit(group)).toBe(expected);
  });
});
