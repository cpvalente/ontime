import { OntimeEvent } from 'ontime-types';

import { makeOperatorMetadata } from '../operator.utils';

describe('makeOperatorMetadata()', () => {
  it('should track past, selected states, gaps and linking', () => {
    const event1 = { id: 'event1', gap: 5, linkStart: false } as OntimeEvent;
    const event2 = { id: 'event2', gap: 10, linkStart: true } as OntimeEvent;
    const event3 = { id: 'event3', gap: 15, linkStart: true } as OntimeEvent;
    const { process } = makeOperatorMetadata('event2');

    expect(process(event1)).toEqual({
      isPast: true,
      isSelected: false,
      totalGap: 5,
      isLinkedToLoaded: false,
    });
    expect(process(event2)).toEqual({
      isPast: false,
      isSelected: true,
      totalGap: 15,
      isLinkedToLoaded: false,
    });
    expect(process(event3)).toEqual({
      isPast: false,
      isSelected: false,
      totalGap: 30,
      isLinkedToLoaded: true,
    });
  });

  it('should handle null selectedId', () => {
    const event1 = { id: 'event1', gap: 5, linkStart: true } as OntimeEvent;
    const event2 = { id: 'event2', gap: 10, linkStart: false } as OntimeEvent;
    const event3 = { id: 'event3', gap: 15, linkStart: true } as OntimeEvent;
    const { process } = makeOperatorMetadata(null);

    expect(process(event1)).toEqual({
      isPast: false,
      isSelected: false,
      totalGap: 5,
      isLinkedToLoaded: true,
    });
    expect(process(event2)).toEqual({
      isPast: false,
      isSelected: false,
      totalGap: 15,
      isLinkedToLoaded: false,
    });
    expect(process(event3)).toEqual({
      isPast: false,
      isSelected: false,
      totalGap: 30,
      isLinkedToLoaded: true,
    });
  });

  it('should break linking chain on countToEnd events', () => {
    const event1 = { id: 'event1', gap: 5, linkStart: true, countToEnd: false } as OntimeEvent;
    const event2 = { id: 'event2', gap: 10, linkStart: true, countToEnd: true } as OntimeEvent;
    const event3 = { id: 'event3', gap: 15, linkStart: true, countToEnd: false } as OntimeEvent;
    const { process } = makeOperatorMetadata(null);

    expect(process(event1)).toEqual({
      isPast: false,
      isSelected: false,
      totalGap: 5,
      isLinkedToLoaded: true,
    });
    expect(process(event2)).toEqual({
      isPast: false,
      isSelected: false,
      totalGap: 15,
      isLinkedToLoaded: true,
    });
    expect(process(event3)).toEqual({
      isPast: false,
      isSelected: false,
      totalGap: 30,
      isLinkedToLoaded: false,
    });
  });
});
