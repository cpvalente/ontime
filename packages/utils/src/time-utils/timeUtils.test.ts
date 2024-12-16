import { type OntimeEvent, type RundownCached, SupportedEvent } from 'ontime-types';

import { MILLIS_PER_SECOND } from '../date-utils/conversionUtils';
import { calculateExpectedStart } from './timeUtils';

//TODO: cross midnight
//TODO: what should happen with overlaps when the offset is behind
//TODO: what should happen with gaps and overlaps when the offset is ahead

describe('calculateExpectedStart()', () => {
  describe('simple', () => {
    const rundownCached: RundownCached = {
      rundown: {
        event1: {
          id: 'event1',
          type: SupportedEvent.Event,
          timeStart: 1 * MILLIS_PER_SECOND,
          timeEnd: 2 * MILLIS_PER_SECOND,
        } as OntimeEvent,
        block1: {
          id: 'block1',
          type: SupportedEvent.Block,
          title: 'BLOCK1',
        },
        event2: {
          id: 'event2',
          type: SupportedEvent.Event,
          timeStart: 2 * MILLIS_PER_SECOND,
          timeEnd: 3 * MILLIS_PER_SECOND,
        } as OntimeEvent,
        event3: {
          id: 'event3',
          type: SupportedEvent.Event,
          timeStart: 3 * MILLIS_PER_SECOND,
          timeEnd: 4 * MILLIS_PER_SECOND,
        } as OntimeEvent,
      },
      order: ['event1', 'block1', 'event2', 'event3'],
      revision: 0,
    };
    test('nothing loaded', () => {
      const clock = 0 * MILLIS_PER_SECOND;
      const currentTimer = null;
      const offset = null;
      const selectedEventIndex = null;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({});
    });

    test('ontime beginning off event', () => {
      const clock = 1 * MILLIS_PER_SECOND;
      const currentTimer = 1 * MILLIS_PER_SECOND;
      const offset = 0;
      const selectedEventIndex = 0;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({
        event2: {
          expectedStart: 2 * MILLIS_PER_SECOND,
          timeUntil: 1 * MILLIS_PER_SECOND,
        },
        event3: {
          expectedStart: 3 * MILLIS_PER_SECOND,
          timeUntil: 2 * MILLIS_PER_SECOND,
        },
      });
    });

    test('ontime end off event', () => {
      const clock = 2 * MILLIS_PER_SECOND;
      const currentTimer = 0 * MILLIS_PER_SECOND;
      const offset = 0;
      const selectedEventIndex = 0;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({
        event2: {
          expectedStart: 2 * MILLIS_PER_SECOND,
          timeUntil: 0 * MILLIS_PER_SECOND,
        },
        event3: {
          expectedStart: 3 * MILLIS_PER_SECOND,
          timeUntil: 1 * MILLIS_PER_SECOND,
        },
      });
    });

    test('offset behind', () => {
      const clock = 2 * MILLIS_PER_SECOND;
      const currentTimer = 1 * MILLIS_PER_SECOND;
      const offset = -1 * MILLIS_PER_SECOND;
      const selectedEventIndex = 0;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({
        event2: {
          expectedStart: 3 * MILLIS_PER_SECOND,
          timeUntil: 1 * MILLIS_PER_SECOND,
        },
        event3: {
          expectedStart: 4 * MILLIS_PER_SECOND,
          timeUntil: 2 * MILLIS_PER_SECOND,
        },
      });
    });

    test('offset ahead', () => {
      const clock = 0 * MILLIS_PER_SECOND;
      const currentTimer = 1 * MILLIS_PER_SECOND;
      const offset = 1 * MILLIS_PER_SECOND;
      const selectedEventIndex = 0;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({
        event2: {
          expectedStart: 1 * MILLIS_PER_SECOND,
          timeUntil: 1 * MILLIS_PER_SECOND,
        },
        event3: {
          expectedStart: 2 * MILLIS_PER_SECOND,
          timeUntil: 2 * MILLIS_PER_SECOND,
        },
      });
    });
  });
  describe('overtime', () => {
    const rundownCached: RundownCached = {
      rundown: {
        event1: {
          id: 'event1',
          type: SupportedEvent.Event,
          timeStart: 1 * MILLIS_PER_SECOND,
          timeEnd: 2 * MILLIS_PER_SECOND,
        } as OntimeEvent,
        block1: {
          id: 'block1',
          type: SupportedEvent.Block,
          title: 'BLOCK1',
        },
        event2: {
          id: 'event2',
          type: SupportedEvent.Event,
          timeStart: 2 * MILLIS_PER_SECOND,
          timeEnd: 3 * MILLIS_PER_SECOND,
        } as OntimeEvent,
        event3: {
          id: 'event3',
          type: SupportedEvent.Event,
          timeStart: 3 * MILLIS_PER_SECOND,
          timeEnd: 4 * MILLIS_PER_SECOND,
        } as OntimeEvent,
      },
      order: ['event1', 'block1', 'event2', 'event3'],
      revision: 0,
    };

    test('overtime behind', () => {
      const clock = 2.5 * MILLIS_PER_SECOND;
      const currentTimer = -0.5 * MILLIS_PER_SECOND;
      const offset = -0.5 * MILLIS_PER_SECOND;
      const selectedEventIndex = 0;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({
        event2: {
          expectedStart: 2.5 * MILLIS_PER_SECOND,
          timeUntil: 0 * MILLIS_PER_SECOND,
        },
        event3: {
          expectedStart: 3.5 * MILLIS_PER_SECOND,
          timeUntil: 1 * MILLIS_PER_SECOND,
        },
      });
    });

    test('overtime ahead', () => {
      const clock = 1.5 * MILLIS_PER_SECOND;
      const currentTimer = -0.5 * MILLIS_PER_SECOND;
      const offset = 0.5 * MILLIS_PER_SECOND;
      const selectedEventIndex = 0;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({
        event2: {
          expectedStart: 1.5 * MILLIS_PER_SECOND,
          timeUntil: 0 * MILLIS_PER_SECOND,
        },
        event3: {
          expectedStart: 2.5 * MILLIS_PER_SECOND,
          timeUntil: 1 * MILLIS_PER_SECOND,
        },
      });
    });
  });

  describe('gaps', () => {
    const rundownCached: RundownCached = {
      rundown: {
        event1: {
          id: 'event1',
          type: SupportedEvent.Event,
          timeStart: 1 * MILLIS_PER_SECOND,
          timeEnd: 2 * MILLIS_PER_SECOND,
        } as OntimeEvent,
        block1: {
          id: 'block1',
          type: SupportedEvent.Block,
          title: 'BLOCK1',
        },
        event2: {
          id: 'event2',
          type: SupportedEvent.Event,
          timeStart: 3 * MILLIS_PER_SECOND,
          timeEnd: 4 * MILLIS_PER_SECOND,
        } as OntimeEvent,
        event3: {
          id: 'event3',
          type: SupportedEvent.Event,
          timeStart: 4 * MILLIS_PER_SECOND,
          timeEnd: 5 * MILLIS_PER_SECOND,
        } as OntimeEvent,
      },
      order: ['event1', 'block1', 'event2', 'event3'],
      revision: 0,
    };

    test('ontime', () => {
      const clock = 1 * MILLIS_PER_SECOND;
      const currentTimer = 1 * MILLIS_PER_SECOND;
      const offset = 0 * MILLIS_PER_SECOND;
      const selectedEventIndex = 0;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({
        event2: {
          expectedStart: 3 * MILLIS_PER_SECOND,
          timeUntil: 2 * MILLIS_PER_SECOND,
        },
        event3: {
          expectedStart: 4 * MILLIS_PER_SECOND,
          timeUntil: 3 * MILLIS_PER_SECOND,
        },
      });
    });

    test('behind', () => {
      const clock = 1.5 * MILLIS_PER_SECOND;
      const currentTimer = 1 * MILLIS_PER_SECOND;
      const offset = -0.5 * MILLIS_PER_SECOND;
      const selectedEventIndex = 0;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({
        event2: {
          expectedStart: 3.5 * MILLIS_PER_SECOND,
          timeUntil: 2 * MILLIS_PER_SECOND,
        },
        event3: {
          expectedStart: 4.5 * MILLIS_PER_SECOND,
          timeUntil: 3 * MILLIS_PER_SECOND,
        },
      });
    });

    test('ahead', () => {
      const clock = 0.5 * MILLIS_PER_SECOND;
      const currentTimer = 1 * MILLIS_PER_SECOND;
      const offset = 0.5 * MILLIS_PER_SECOND;
      const selectedEventIndex = 0;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({
        event2: {
          expectedStart: 2.5 * MILLIS_PER_SECOND,
          timeUntil: 2 * MILLIS_PER_SECOND,
        },
        event3: {
          expectedStart: 3.5 * MILLIS_PER_SECOND,
          timeUntil: 3 * MILLIS_PER_SECOND,
        },
      });
    });
  });

  describe('gaps and overtime', () => {
    const rundownCached: RundownCached = {
      rundown: {
        event1: {
          id: 'event1',
          type: SupportedEvent.Event,
          timeStart: 1 * MILLIS_PER_SECOND,
          timeEnd: 2 * MILLIS_PER_SECOND,
        } as OntimeEvent,
        block1: {
          id: 'block1',
          type: SupportedEvent.Block,
          title: 'BLOCK1',
        },
        event2: {
          id: 'event2',
          type: SupportedEvent.Event,
          timeStart: 3 * MILLIS_PER_SECOND,
          timeEnd: 4 * MILLIS_PER_SECOND,
        } as OntimeEvent,
        event3: {
          id: 'event3',
          type: SupportedEvent.Event,
          timeStart: 5 * MILLIS_PER_SECOND,
          timeEnd: 6 * MILLIS_PER_SECOND,
        } as OntimeEvent,
        event4: {
          id: 'event4',
          type: SupportedEvent.Event,
          timeStart: 6 * MILLIS_PER_SECOND,
          timeEnd: 7 * MILLIS_PER_SECOND,
        } as OntimeEvent,
      },
      order: ['event1', 'block1', 'event2', 'event3', 'event4'],
      revision: 0,
    };

    test('behind consumes 1 gap partially', () => {
      const clock = 2.5 * MILLIS_PER_SECOND;
      const currentTimer = -0.5 * MILLIS_PER_SECOND;
      const offset = -0.5 * MILLIS_PER_SECOND;
      const selectedEventIndex = 0;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({
        event2: {
          expectedStart: 3 * MILLIS_PER_SECOND,
          timeUntil: 0.5 * MILLIS_PER_SECOND,
        },
        event3: {
          expectedStart: 5 * MILLIS_PER_SECOND,
          timeUntil: 2.5 * MILLIS_PER_SECOND,
        },
        event4: {
          expectedStart: 6 * MILLIS_PER_SECOND,
          timeUntil: 3.5 * MILLIS_PER_SECOND,
        },
      });
    });

    test('behind consumes 1 gap partially', () => {
      const clock = 2.25 * MILLIS_PER_SECOND;
      const currentTimer = -0.25 * MILLIS_PER_SECOND;
      const offset = -0.25 * MILLIS_PER_SECOND;
      const selectedEventIndex = 0;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({
        event2: {
          expectedStart: 3 * MILLIS_PER_SECOND,
          timeUntil: 0.75 * MILLIS_PER_SECOND,
        },
        event3: {
          expectedStart: 5 * MILLIS_PER_SECOND,
          timeUntil: 2.75 * MILLIS_PER_SECOND,
        },
        event4: {
          expectedStart: 6 * MILLIS_PER_SECOND,
          timeUntil: 3.75 * MILLIS_PER_SECOND,
        },
      });
    });

    test('behind consumes 1 gap fully', () => {
      const clock = 3 * MILLIS_PER_SECOND;
      const currentTimer = -1 * MILLIS_PER_SECOND;
      const offset = -1 * MILLIS_PER_SECOND;
      const selectedEventIndex = 0;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({
        event2: {
          expectedStart: 3 * MILLIS_PER_SECOND,
          timeUntil: 0 * MILLIS_PER_SECOND,
        },
        event3: {
          expectedStart: 5 * MILLIS_PER_SECOND,
          timeUntil: 2 * MILLIS_PER_SECOND,
        },
        event4: {
          expectedStart: 6 * MILLIS_PER_SECOND,
          timeUntil: 3 * MILLIS_PER_SECOND,
        },
      });
    });

    test('behind consumes 2 gaps partially', () => {
      const clock = 3.5 * MILLIS_PER_SECOND;
      const currentTimer = -1.5 * MILLIS_PER_SECOND;
      const offset = -1.5 * MILLIS_PER_SECOND;
      const selectedEventIndex = 0;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({
        event2: {
          expectedStart: 3.5 * MILLIS_PER_SECOND,
          timeUntil: 0 * MILLIS_PER_SECOND,
        },
        event3: {
          expectedStart: 5 * MILLIS_PER_SECOND,
          timeUntil: 1.5 * MILLIS_PER_SECOND,
        },
        event4: {
          expectedStart: 6 * MILLIS_PER_SECOND,
          timeUntil: 2.5 * MILLIS_PER_SECOND,
        },
      });
    });

    test('behind consumes 2 gaps partially', () => {
      const clock = 3.75 * MILLIS_PER_SECOND;
      const currentTimer = -1.75 * MILLIS_PER_SECOND;
      const offset = -1.75 * MILLIS_PER_SECOND;
      const selectedEventIndex = 0;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({
        event2: {
          expectedStart: 3.75 * MILLIS_PER_SECOND,
          timeUntil: 0 * MILLIS_PER_SECOND,
        },
        event3: {
          expectedStart: 5 * MILLIS_PER_SECOND,
          timeUntil: 1.25 * MILLIS_PER_SECOND,
        },
        event4: {
          expectedStart: 6 * MILLIS_PER_SECOND,
          timeUntil: 2.25 * MILLIS_PER_SECOND,
        },
      });
    });

    test('behind consumes 2 gaps fully', () => {
      const clock = 4 * MILLIS_PER_SECOND;
      const currentTimer = -2 * MILLIS_PER_SECOND;
      const offset = -2 * MILLIS_PER_SECOND;
      const selectedEventIndex = 0;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({
        event2: {
          expectedStart: 4 * MILLIS_PER_SECOND,
          timeUntil: 0 * MILLIS_PER_SECOND,
        },
        event3: {
          expectedStart: 5 * MILLIS_PER_SECOND,
          timeUntil: 1 * MILLIS_PER_SECOND,
        },
        event4: {
          expectedStart: 6 * MILLIS_PER_SECOND,
          timeUntil: 2 * MILLIS_PER_SECOND,
        },
      });
    });

    test('behind overconsumes 2 gaps', () => {
      const clock = 4.1 * MILLIS_PER_SECOND;
      const currentTimer = -2.1 * MILLIS_PER_SECOND;
      const offset = -2.1 * MILLIS_PER_SECOND;
      const selectedEventIndex = 0;
      expect(calculateExpectedStart(rundownCached, offset, clock, selectedEventIndex, currentTimer)).toEqual({
        event2: {
          expectedStart: 4.1 * MILLIS_PER_SECOND,
          timeUntil: 0 * MILLIS_PER_SECOND,
        },
        event3: {
          expectedStart: 5.1 * MILLIS_PER_SECOND,
          timeUntil: 1 * MILLIS_PER_SECOND,
        },
        event4: {
          expectedStart: 6.1 * MILLIS_PER_SECOND,
          timeUntil: 2 * MILLIS_PER_SECOND,
        },
      });
    });
  });
});
