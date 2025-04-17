import { OntimeEvent, SupportedEntry } from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { apply } from '../delayUtils.js';
import { makeOntimeBlock, makeOntimeDelay, makeOntimeEvent, makeRundown } from '../__mocks__/rundown.mocks.js';

describe('apply()', () => {
  it('applies a positive delay to the rundown', () => {
    const testRundown = makeRundown({
      revision: 0,
      order: ['delay', '1', '2', '3', '4', '5'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: 10 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 10, duration: 10 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 10, timeEnd: 20, duration: 10, linkStart: true }),
        '3': makeOntimeBlock({ id: '3' }),
        '4': makeOntimeEvent({ id: '4', timeStart: 20, timeEnd: 30, duration: 10, linkStart: false }),
        '5': makeOntimeEvent({ id: '5', timeStart: 30, timeEnd: 40, duration: 10, linkStart: true }),
      },
    });

    apply('delay', testRundown);
    expect(testRundown.revision).toBe(1);
    expect(testRundown.order).toMatchObject(['1', '2', '3', '4', '5']);
    expect(testRundown.entries).toMatchObject({
      '1': { id: '1', timeStart: 10, timeEnd: 20, duration: 10, revision: 2 },
      '2': { id: '2', timeStart: 20, timeEnd: 30, duration: 10, revision: 2, linkStart: true },
      '3': { id: '3' },
      '4': { id: '4', timeStart: 30, timeEnd: 40, duration: 10, revision: 2, linkStart: false },
      '5': { id: '5', timeStart: 40, timeEnd: 50, duration: 10, revision: 2, linkStart: true },
    });
  });

  it('applies negative delays', () => {
    const testRundown = makeRundown({
      revision: 0,
      order: ['delay', '1', '2', '3', '4', '5'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: -10 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 10, duration: 10 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 10, timeEnd: 20, duration: 10, linkStart: true }),
        '3': makeOntimeBlock({ id: '3' }),
        '4': makeOntimeEvent({ id: '4', timeStart: 20, timeEnd: 30, duration: 10, linkStart: false }),
        '5': makeOntimeEvent({ id: '5', timeStart: 30, timeEnd: 40, duration: 10, linkStart: true }),
      },
    });

    apply('delay', testRundown);
    expect(testRundown.revision).toBe(1);
    expect(testRundown.order).toMatchObject(['1', '2', '3', '4', '5']);
    expect(testRundown.entries).toMatchObject({
      '1': { id: '1', timeStart: 0, timeEnd: 10, duration: 10, revision: 2 },
      '2': { id: '2', timeStart: 0, timeEnd: 10, duration: 10, revision: 2, linkStart: false },
      '3': { id: '3' },
      '4': { id: '4', timeStart: 10, timeEnd: 20, duration: 10, revision: 2, linkStart: false },
      '5': { id: '5', timeStart: 20, timeEnd: 30, duration: 10, revision: 2, linkStart: true },
    });
  });

  it('should account for minimum duration and start when applying negative delays', () => {
    const testRundown = makeRundown({
      order: ['delay', '1', '2'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: -50 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, linkStart: true }),
      },
    });

    apply('delay', testRundown);
    expect(testRundown.order).toMatchObject(['1', '2']);
    expect(testRundown.entries).toMatchObject({
      '1': {
        id: '1',
        type: SupportedEntry.Event,
        timeStart: 0,
        timeEnd: 100,
        duration: 100,
        revision: 2,
      } as OntimeEvent,
      '2': {
        id: '2',
        type: SupportedEntry.Event,
        timeStart: 50,
        timeEnd: 100,
        duration: 50,
        linkStart: false,
        revision: 2,
      },
    });
  });

  it('unlinks events to maintain gaps when applying positive delays', () => {
    const testRundown = makeRundown({
      order: ['1', 'delay', '2'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 }),
        delay: makeOntimeDelay({ id: 'delay', duration: 50 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, revision: 1, linkStart: true }),
      },
    });

    apply('delay', testRundown);
    expect(testRundown.order).toMatchObject(['1', '2']);
    expect(testRundown.entries).toMatchObject({
      '1': {
        id: '1',
        timeStart: 0,
        timeEnd: 100,
        duration: 100,
        revision: 1,
      },
      '2': {
        id: '2',
        timeStart: 150,
        timeEnd: 200,
        duration: 50,
        linkStart: false,
        revision: 2,
      },
    });
  });

  it('maintains links if there is no gap', () => {
    const testRundown = makeRundown({
      order: ['delay', '1', '2'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: 50 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, revision: 1, linkStart: true }),
      },
    });

    apply('delay', testRundown);
    expect(testRundown.order).toMatchObject(['1', '2']);
    expect(testRundown.entries).toMatchObject({
      '1': {
        id: '1',
        timeStart: 50,
        timeEnd: 150,
        duration: 100,
        revision: 2,
      },
      '2': {
        id: '2',
        timeStart: 150,
        timeEnd: 200,
        duration: 50,
        linkStart: true,
        revision: 2,
      },
    });
  });

  it('unlinks events to maintain gaps when applying negative delays', () => {
    const testRundown = makeRundown({
      order: ['1', 'delay', '2'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 }),
        delay: makeOntimeDelay({ id: 'delay', duration: -50 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, revision: 1, linkStart: true }),
      },
    });

    apply('delay', testRundown);
    expect(testRundown.order).toMatchObject(['1', '2']);
    expect(testRundown.entries).toMatchObject({
      '1': { id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 },
      '2': {
        id: '2',
        timeStart: 50,
        timeEnd: 100,
        duration: 50,
        linkStart: false,
        revision: 2,
      },
    });
  });

  it('gaps reduce positive delay', () => {
    const testRundown = makeRundown({
      order: ['delay', '1', '2', '3', '4', '5'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: 100 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
        // gap 50
        '2': makeOntimeEvent({ id: '2', timeStart: 150, timeEnd: 200, duration: 50, gap: 50 }),
        // gap 0
        '3': makeOntimeEvent({ id: '3', timeStart: 200, timeEnd: 250, duration: 50, gap: 0 }),
        // gap 50
        '4': makeOntimeEvent({ id: '4', timeStart: 300, timeEnd: 350, duration: 50, gap: 50 }),
        // linked
        '5': makeOntimeEvent({ id: '5', timeStart: 350, timeEnd: 400, duration: 50, linkStart: true }),
      },
    });

    apply('delay', testRundown);
    expect(testRundown.order).toMatchObject(['1', '2', '3', '4', '5']);
    expect(testRundown.entries).toMatchObject({
      '1': { id: '1', timeStart: 0 + 100, timeEnd: 100 + 100, duration: 100, revision: 2 },
      // gap 50 (100 - 50)
      '2': { id: '2', timeStart: 150 + 50, timeEnd: 200 + 50, duration: 50, revision: 2 },
      // gap 50 (50 - 50)
      '3': { id: '3', timeStart: 200 + 50, timeEnd: 250 + 50, duration: 50, revision: 2, gap: 0 },
      // gap (delay is 0)
      '4': { id: '4', timeStart: 300, timeEnd: 350, duration: 50, revision: 1 },
      // linked
      '5': { id: '5', timeStart: 350, timeEnd: 400, duration: 50, revision: 1, linkStart: true },
    });
  });

  it('gaps reduce positive delay (2)', () => {
    const testRundown = makeRundown({
      order: ['delay', '1', '2'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: 2 * MILLIS_PER_HOUR }),
        '1': makeOntimeEvent({
          id: '1',
          gap: 0,
          dayOffset: 0,
          timeStart: 46800000, // 13:00:00
          timeEnd: 50400000, // 14:00:00
          duration: MILLIS_PER_HOUR,
        }),
        // gap 1h
        '2': makeOntimeEvent({
          id: '2',
          gap: 1 * MILLIS_PER_HOUR,
          dayOffset: 0,
          timeStart: 54000000, // 15:00:00
          timeEnd: 57600000, // 16:00:00
          duration: MILLIS_PER_HOUR,
        }),
      },
    });

    apply('delay', testRundown);
    expect(testRundown.order).toMatchObject(['1', '2']);
    expect(testRundown.entries).toMatchObject({
      '1': { id: '1', timeStart: 54000000 /* 16 */, revision: 2 },
      // gap 1h (2h - 1h)
      '2': { id: '2', timeStart: 57600000 /* 16 */, revision: 2 },
    });
  });

  it('removes empty delays without applying changes', () => {
    const testRundown = makeRundown({
      order: ['delay', '1'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: 0 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
      },
    });

    apply('delay', testRundown);
    expect(testRundown.order).toMatchObject(['1']);
    expect(testRundown.entries).toMatchObject({ '1': { id: '1', timeStart: 0, timeEnd: 100, duration: 100 } });
  });

  it('removes delays in last position without applying changes', () => {
    const testRundown = makeRundown({
      order: ['1', 'delay'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
        delay: makeOntimeDelay({ id: 'delay', duration: 100 }),
      },
    });

    apply('delay', testRundown);
    expect(testRundown.order).toMatchObject(['1']);
    expect(testRundown.entries).toMatchObject({ '1': { id: '1', timeStart: 0, timeEnd: 100, duration: 100 } });
  });

  it('unlinks events to across blocks is it is the first event after the delay', () => {
    const testRundown = makeRundown({
      order: ['1', 'delay', 'block', '2'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 }),
        delay: makeOntimeDelay({ id: 'delay', duration: 50 }),
        block: makeOntimeBlock({ id: 'block' }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, revision: 1, linkStart: true }),
      },
    });

    apply('delay', testRundown);
    expect(testRundown.order).toMatchObject(['1', 'block', '2']);

    expect(testRundown.entries).toMatchObject({
      '1': {
        id: '1',
        timeStart: 0,
        timeEnd: 100,
        duration: 100,
        revision: 1,
      },
      block: { id: 'block' },
      '2': {
        id: '2',
        timeStart: 150,
        timeEnd: 200,
        duration: 50,
        linkStart: false,
        revision: 2,
      },
    });
  });
});
