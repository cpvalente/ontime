import { OntimeBlock, OntimeEvent, OntimeRundown, SupportedEvent } from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { apply } from '../delayUtils.js';
import { makeOntimeDelay, makeOntimeEvent } from '../__mocks__/rundown.mocks.js';

describe('apply()', () => {
  it('applies a positive delay to the rundown', () => {
    const testRundown = [
      makeOntimeDelay(10),
      makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 10, duration: 10 }),
      makeOntimeEvent({ id: '2', timeStart: 10, timeEnd: 20, duration: 10, linkStart: '1' }),
      { id: '3', type: SupportedEvent.Block } as OntimeBlock,
      makeOntimeEvent({ id: '4', timeStart: 20, timeEnd: 30, duration: 10, linkStart: null }),
      makeOntimeEvent({ id: '5', timeStart: 30, timeEnd: 40, duration: 10, linkStart: '4' }),
    ];

    const updatedRundown = apply('delay', testRundown);
    expect(updatedRundown).not.toBe(testRundown);
    expect(updatedRundown).toMatchObject([
      { id: '1', timeStart: 10, timeEnd: 20, duration: 10, revision: 2 },
      { id: '2', timeStart: 20, timeEnd: 30, duration: 10, revision: 2, linkStart: '1' },
      { id: '3' },
      { id: '4', timeStart: 30, timeEnd: 40, duration: 10, revision: 2, linkStart: null },
      { id: '5', timeStart: 40, timeEnd: 50, duration: 10, revision: 2, linkStart: '4' },
    ]);
  });

  it('applies negative delays', () => {
    const testRundown = [
      makeOntimeDelay(-10),
      makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 10, duration: 10 }),
      makeOntimeEvent({ id: '2', timeStart: 10, timeEnd: 20, duration: 10, linkStart: '1' }),
      { id: '3', type: SupportedEvent.Block } as OntimeBlock,
      makeOntimeEvent({ id: '4', timeStart: 20, timeEnd: 30, duration: 10, linkStart: null }),
      makeOntimeEvent({ id: '5', timeStart: 30, timeEnd: 40, duration: 10, linkStart: '4' }),
    ];

    const updatedRundown = apply('delay', testRundown);
    expect(updatedRundown).toMatchObject([
      { id: '1', timeStart: 0, timeEnd: 10, duration: 10, revision: 2 },
      { id: '2', timeStart: 0, timeEnd: 10, duration: 10, revision: 2, linkStart: null },
      { id: '3' },
      { id: '4', timeStart: 10, timeEnd: 20, duration: 10, revision: 2, linkStart: null },
      { id: '5', timeStart: 20, timeEnd: 30, duration: 10, revision: 2, linkStart: '4' },
    ]);
  });

  it('should account for minimum duration and start when applying negative delays', () => {
    const testRundown: OntimeRundown = [
      makeOntimeDelay(-50),
      makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
      makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, linkStart: '1' }),
    ];

    const expected = [
      { id: '1', type: SupportedEvent.Event, timeStart: 0, timeEnd: 100, duration: 100, revision: 2 } as OntimeEvent,
      {
        id: '2',
        type: SupportedEvent.Event,
        timeStart: 50,
        timeEnd: 100,
        duration: 50,
        linkStart: null,
        revision: 2,
      } as OntimeEvent,
    ];

    const updatedRundown = apply('delay', testRundown);
    expect(updatedRundown).toMatchObject(expected);
  });

  it('unlinks events to maintain gaps when applying positive delays', () => {
    const testRundown = [
      makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 }),
      makeOntimeDelay(50),
      makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, revision: 1, linkStart: '1' }),
    ];

    expect(apply('delay', testRundown)).toMatchObject([
      { id: '1', type: SupportedEvent.Event, timeStart: 0, timeEnd: 100, duration: 100, revision: 1 } as OntimeEvent,
      {
        id: '2',
        type: SupportedEvent.Event,
        timeStart: 150,
        timeEnd: 200,
        duration: 50,
        linkStart: null,
        revision: 2,
      } as OntimeEvent,
    ]);
  });

  it('maintains links if there is no gap', () => {
    const testRundown = [
      makeOntimeDelay(50),
      makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 }),
      makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, revision: 1, linkStart: '1' }),
    ];

    expect(apply('delay', testRundown)).toMatchObject([
      { id: '1', type: SupportedEvent.Event, timeStart: 50, timeEnd: 150, duration: 100, revision: 2 } as OntimeEvent,
      {
        id: '2',
        type: SupportedEvent.Event,
        timeStart: 150,
        timeEnd: 200,
        duration: 50,
        linkStart: '1',
        revision: 2,
      } as OntimeEvent,
    ]);
  });

  it('unlinks events to maintain gaps when applying negative delays', () => {
    const testRundown = [
      makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 }),
      makeOntimeDelay(-50),
      makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, revision: 1, linkStart: '1' }),
    ];

    expect(apply('delay', testRundown)).toMatchObject([
      { id: '1', type: SupportedEvent.Event, timeStart: 0, timeEnd: 100, duration: 100, revision: 1 } as OntimeEvent,
      {
        id: '2',
        type: SupportedEvent.Event,
        timeStart: 50,
        timeEnd: 100,
        duration: 50,
        linkStart: null,
        revision: 2,
      } as OntimeEvent,
    ]);
  });

  it('gaps reduce positive delay', () => {
    const testRundown: OntimeRundown = [
      makeOntimeDelay(100),
      makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
      // gap 50
      makeOntimeEvent({ id: '2', timeStart: 150, timeEnd: 200, duration: 50, gap: 50 }),
      // gap 0
      makeOntimeEvent({ id: '3', timeStart: 200, timeEnd: 250, duration: 50, gap: 0 }),
      // gap 50
      makeOntimeEvent({ id: '4', timeStart: 300, timeEnd: 350, duration: 50, gap: 50 }),
      // linked
      makeOntimeEvent({ id: '5', timeStart: 350, timeEnd: 400, duration: 50, linkStart: '4' }),
    ];

    const updatedRundown = apply('delay', testRundown);
    expect(updatedRundown).toMatchObject([
      { id: '1', timeStart: 0 + 100, timeEnd: 100 + 100, duration: 100, revision: 2 },
      // gap 50 (100 - 50)
      { id: '2', timeStart: 150 + 50, timeEnd: 200 + 50, duration: 50, revision: 2 },
      // gap 50 (50 - 50)
      { id: '3', timeStart: 200 + 50, timeEnd: 250 + 50, duration: 50, revision: 2, gap: 0 },
      // gap (delay is 0)
      { id: '4', timeStart: 300, timeEnd: 350, duration: 50, revision: 1 },
      // linked
      { id: '5', timeStart: 350, timeEnd: 400, duration: 50, revision: 1, linkStart: '4' },
    ]);
  });

  it('gaps reduce positive delay (2)', () => {
    const testRundown: OntimeRundown = [
      makeOntimeDelay(2 * MILLIS_PER_HOUR),
      makeOntimeEvent({
        id: '1',
        gap: 0,
        dayOffset: 0,
        timeStart: 46800000, // 13:00:00
        timeEnd: 50400000, // 14:00:00
        duration: MILLIS_PER_HOUR,
      }),
      // gap 1h
      makeOntimeEvent({
        id: '2',
        gap: 1 * MILLIS_PER_HOUR,
        dayOffset: 0,
        timeStart: 54000000, // 15:00:00
        timeEnd: 57600000, // 16:00:00
        duration: MILLIS_PER_HOUR,
      }),
    ];

    const updatedRundown = apply('delay', testRundown);
    expect(updatedRundown).toMatchObject([
      { id: '1', timeStart: 54000000 /* 16 */, revision: 2 },
      // gap 1h (2h - 1h)
      { id: '2', timeStart: 57600000 /* 16 */, revision: 2 },
    ]);
  });

  it('removes empty delays without applying changes', () => {
    const testRundown: OntimeRundown = [
      makeOntimeDelay(0),
      makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
    ];

    const updatedRundown = apply('delay', testRundown);
    expect(updatedRundown).toMatchObject([{ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }]);
  });

  it('removes delays in last position without applying changes', () => {
    const testRundown: OntimeRundown = [
      makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
      makeOntimeDelay(100),
    ];

    const updatedRundown = apply('delay', testRundown);
    expect(updatedRundown).toMatchObject([{ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }]);
  });

  it('unlinks events to across blocks is it is the first event after the delay', () => {
    const testRundown = [
      makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 }),
      makeOntimeDelay(50),
      { id: 'block', type: SupportedEvent.Block } as OntimeBlock,
      makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, revision: 1, linkStart: '1' }),
    ];
    expect(apply('delay', testRundown)).toMatchObject([
      { id: '1', type: SupportedEvent.Event, timeStart: 0, timeEnd: 100, duration: 100, revision: 1 } as OntimeEvent,
      { id: 'block', type: SupportedEvent.Block },
      {
        id: '2',
        type: SupportedEvent.Event,
        timeStart: 150,
        timeEnd: 200,
        duration: 50,
        linkStart: null,
        revision: 2,
      } as OntimeEvent,
    ]);
  });
});
