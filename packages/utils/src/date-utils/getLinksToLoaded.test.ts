import type { OntimeDelay, OntimeEntry, OntimeEvent, OntimeGroup } from 'ontime-types';
import { SupportedEntry } from 'ontime-types';

import { getLinksToLoaded } from './getLinksToLoaded.js';

function event(id: string, patch: Partial<OntimeEvent> = {}): OntimeEvent {
  return {
    id,
    type: SupportedEntry.Event,
    parent: null,
    timeStart: 0,
    duration: 10,
    dayOffset: 0,
    gap: 0,
    skip: false,
    linkStart: false,
    countToEnd: false,
    ...patch,
  } as OntimeEvent;
}

function walk(list: OntimeEntry[], loadedId: string | null) {
  const entries = Object.fromEntries(list.map((entry) => [entry.id, entry]));
  return Object.fromEntries(getLinksToLoaded(entries, Object.keys(entries), loadedId));
}

describe('getLinksToLoaded()', () => {
  it('follows the link chain and accumulates gaps after the loaded event', () => {
    const result = walk(
      [
        event('before', { gap: 100 }),
        event('loaded', { gap: 100 }),
        event('linked', { linkStart: true }),
        event('unlinked', { gap: 5 }),
        event('relinked', { gap: 3, linkStart: true }),
      ],
      'loaded',
    );

    expect(result).toStrictEqual({
      loaded: { totalGap: 0, isLinkedToLoaded: true },
      linked: { totalGap: 0, isLinkedToLoaded: true },
      unlinked: { totalGap: 5, isLinkedToLoaded: false },
      relinked: { totalGap: 8, isLinkedToLoaded: false },
    });
  });

  it('passes over skipped events, delays and groups', () => {
    const result = walk(
      [
        event('loaded'),
        event('skipped', { skip: true, gap: 50 }),
        { id: 'group', type: SupportedEntry.Group, entries: ['nested'] } as unknown as OntimeGroup,
        { id: 'delay', type: SupportedEntry.Delay, parent: null, duration: 0 } as OntimeDelay,
        event('nested', { parent: 'group', linkStart: true, gap: 0 }),
      ],
      'loaded',
    );

    expect(result).toStrictEqual({
      loaded: { totalGap: 0, isLinkedToLoaded: true },
      nested: { totalGap: 0, isLinkedToLoaded: true },
    });
  });

  it('breaks the chain after a countToEnd event and gives its duration back as gap', () => {
    const result = walk(
      [
        event('loaded'),
        event('countToEnd', { linkStart: true, countToEnd: true, duration: 10 }),
        event('next', { linkStart: true }),
        event('later', { linkStart: true, gap: 5 }),
      ],
      'loaded',
    );

    expect(result).toMatchObject({
      countToEnd: { totalGap: 0, isLinkedToLoaded: true },
      next: { totalGap: 10, isLinkedToLoaded: false },
      later: { totalGap: 15, isLinkedToLoaded: false },
    });
  });

  it('keeps the chain after a loaded countToEnd event', () => {
    const result = walk([event('loaded', { countToEnd: true }), event('next', { linkStart: true })], 'loaded');

    expect(result.next).toStrictEqual({ totalGap: 0, isLinkedToLoaded: true });
  });

  it('walks downstream of a loaded event which is skipped', () => {
    const result = walk([event('loaded', { skip: true }), event('next', { linkStart: true, gap: 5 })], 'loaded');

    expect(result).toStrictEqual({
      loaded: { totalGap: 0, isLinkedToLoaded: true },
      next: { totalGap: 5, isLinkedToLoaded: true },
    });
  });

  it('walks every event without links when nothing is loaded', () => {
    const result = walk([event('a', { gap: 2 }), event('b', { linkStart: true, gap: 3 })], null);

    expect(result).toStrictEqual({
      a: { totalGap: 2, isLinkedToLoaded: false },
      b: { totalGap: 5, isLinkedToLoaded: false },
    });
  });

  it('returns nothing when the loaded event is not in the order', () => {
    expect(walk([event('a')], 'missing')).toStrictEqual({});
  });
});
