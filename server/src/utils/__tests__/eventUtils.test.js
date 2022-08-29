import { getPreviousPlayable } from '../eventUtils.js';

describe('getPreviousPlayable()', () => {
  describe('given a list of events', () => {
    it('finds the previous playable event', () => {
      const events = [
        { id: 100, type: 'delay' },
        { id: 101, type: 'event', skip: true },
        { id: 102, type: 'event', skip: true },
        { id: 103, type: 'event', skip: false },
        { id: 'not-this', type: 'block' },
        { id: 104, type: 'event' },
      ];
      const { index, id } = getPreviousPlayable(events, events[4].id);
      expect(index).toBe(3);
      expect(id).toBe(103);
    });
  });

  describe('handles common errors', () => {
    it('returns null if id not found in list', () => {
      const events = [
        { id: 0, type: 'delay' },
        { id: 1, type: 'event', skip: true },
        { id: 2, type: 'event', skip: true },
        { id: 3, type: 'event', skip: false },
        { id: 4, type: 'event' },
      ];
      const { index, id } = getPreviousPlayable(events, 'no-valid-id');
      expect(index).toBe(null);
      expect(id).toBe(null);
    });

    it('returns null if there are no previous events to play', () => {
      const events = [
        { id: 0, type: 'delay' },
        { id: 1, type: 'event', skip: true },
        { id: 2, type: 'event', skip: true },
        { id: 3, type: 'event', skip: true },
        { id: 4, type: 'event' },
      ];
      const { index, id } = getPreviousPlayable(events, events[4].id);
      expect(index).toBe(null);
      expect(id).toBe(null);
    });

    it('returns null if list is empty', () => {
      const events = [];
      const { index, id } = getPreviousPlayable(events, 'made-up');
      expect(index).toBe(null);
      expect(id).toBe(null);
    });
  });
});
