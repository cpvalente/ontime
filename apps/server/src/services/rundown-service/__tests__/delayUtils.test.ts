import { OntimeBlock, OntimeDelay, OntimeEvent, OntimeRundown, SupportedEvent } from 'ontime-types';
import { apply } from '../delayUtils.js';

describe('apply() ', () => {
  describe('in a rundown without the delay field, persisted rundown', () => {
    it('applies delays', () => {
      const delayId = '1';
      const testRundown: OntimeRundown = [
        { id: delayId, type: SupportedEvent.Delay, duration: 10 } as OntimeDelay,
        { id: '2', type: SupportedEvent.Event, timeStart: 0, timeEnd: 10, duration: 10, revision: 1 } as OntimeEvent,
        { id: '3', type: SupportedEvent.Event, timeStart: 0, timeEnd: 10, duration: 10, revision: 1 } as OntimeEvent,
        { id: '4', type: SupportedEvent.Block } as OntimeBlock,
        { id: '5', type: SupportedEvent.Event, timeStart: 0, timeEnd: 10, duration: 10, revision: 1 } as OntimeEvent,
      ];

      const expected = [
        { id: '2', type: SupportedEvent.Event, timeStart: 10, timeEnd: 20, duration: 10, revision: 2 } as OntimeEvent,
        { id: '3', type: SupportedEvent.Event, timeStart: 10, timeEnd: 20, duration: 10, revision: 2 } as OntimeEvent,
        { id: '4', type: SupportedEvent.Block } as OntimeBlock,
        { id: '5', type: SupportedEvent.Event, timeStart: 0, timeEnd: 10, duration: 10, revision: 1 } as OntimeEvent,
      ];

      const updatedRundown = apply(delayId, testRundown);
      expect(updatedRundown).toStrictEqual(expected);
    });
    it('applies negative delays', () => {
      const delayId = '1';
      const testRundown: OntimeRundown = [
        { id: delayId, type: SupportedEvent.Delay, duration: -10 } as OntimeDelay,
        { id: '2', type: SupportedEvent.Event, timeStart: 0, timeEnd: 10, duration: 10, revision: 1 } as OntimeEvent,
        { id: '3', type: SupportedEvent.Event, timeStart: 20, timeEnd: 40, duration: 20, revision: 1 } as OntimeEvent,
        { id: '4', type: SupportedEvent.Block } as OntimeBlock,
        { id: '5', type: SupportedEvent.Event, timeStart: 0, timeEnd: 10, duration: 10, revision: 1 } as OntimeEvent,
      ];

      const expected = [
        { id: '2', type: SupportedEvent.Event, timeStart: 0, timeEnd: 10, duration: 10, revision: 2 } as OntimeEvent,
        { id: '3', type: SupportedEvent.Event, timeStart: 10, timeEnd: 30, duration: 20, revision: 2 } as OntimeEvent,
        { id: '4', type: SupportedEvent.Block } as OntimeBlock,
        { id: '5', type: SupportedEvent.Event, timeStart: 0, timeEnd: 10, duration: 10, revision: 1 } as OntimeEvent,
      ];

      const updatedRundown = apply(delayId, testRundown);
      expect(updatedRundown).toStrictEqual(expected);
    });
    it('maintains constant duration', () => {
      const delayId = '1';
      const testRundown: OntimeRundown = [
        { id: delayId, type: SupportedEvent.Delay, duration: -30 } as OntimeDelay,
        { id: '2', type: SupportedEvent.Event, timeStart: 0, timeEnd: 10, duration: 10, revision: 1 } as OntimeEvent,
        { id: '3', type: SupportedEvent.Event, timeStart: 20, timeEnd: 40, duration: 20, revision: 1 } as OntimeEvent,
      ];

      const expected = [
        { id: '2', type: SupportedEvent.Event, timeStart: 0, timeEnd: 10, duration: 10, revision: 2 } as OntimeEvent,
        { id: '3', type: SupportedEvent.Event, timeStart: 0, timeEnd: 20, duration: 20, revision: 2 } as OntimeEvent,
      ];

      const updatedRundown = apply(delayId, testRundown);
      expect(updatedRundown).toStrictEqual(expected);
    });
  });
  describe('in a rundown with the delay field, cached rundown', () => {
    it('applies delays', () => {
      const delayId = '1';
      const testRundown: OntimeRundown = [
        { id: delayId, type: SupportedEvent.Delay, duration: 10 } as OntimeDelay,
        {
          id: '2',
          type: SupportedEvent.Event,
          timeStart: 0,
          timeEnd: 10,
          duration: 10,
          revision: 1,
          delay: 10,
        } as OntimeEvent,
        {
          id: '3',
          type: SupportedEvent.Event,
          timeStart: 0,
          timeEnd: 10,
          duration: 10,
          revision: 1,
          delay: 10,
        } as OntimeEvent,
        { id: '4', type: SupportedEvent.Block } as OntimeBlock,
        {
          id: '5',
          type: SupportedEvent.Event,
          timeStart: 0,
          timeEnd: 10,
          duration: 10,
          revision: 1,
          delay: 0,
        } as OntimeEvent,
      ];

      const expected = [
        {
          id: '2',
          type: SupportedEvent.Event,
          timeStart: 10,
          timeEnd: 20,
          duration: 10,
          revision: 2,
          delay: 0,
        } as OntimeEvent,
        {
          id: '3',
          type: SupportedEvent.Event,
          timeStart: 10,
          timeEnd: 20,
          duration: 10,
          revision: 2,
          delay: 0,
        } as OntimeEvent,
        { id: '4', type: SupportedEvent.Block } as OntimeBlock,
        {
          id: '5',
          type: SupportedEvent.Event,
          timeStart: 0,
          timeEnd: 10,
          duration: 10,
          revision: 1,
          delay: 0,
        } as OntimeEvent,
      ];

      const updatedRundown = apply(delayId, testRundown);
      expect(updatedRundown).toStrictEqual(expected);
    });
    it('applies negative delays', () => {
      const delayId = '1';
      const testRundown: OntimeRundown = [
        { id: delayId, type: SupportedEvent.Delay, duration: -10 } as OntimeDelay,
        {
          id: '2',
          type: SupportedEvent.Event,
          timeStart: 0,
          timeEnd: 10,
          duration: 10,
          revision: 1,
          delay: -10,
        } as OntimeEvent,
        {
          id: '3',
          type: SupportedEvent.Event,
          timeStart: 20,
          timeEnd: 40,
          duration: 20,
          revision: 1,
          delay: -10,
        } as OntimeEvent,
        { id: '4', type: SupportedEvent.Block } as OntimeBlock,
        {
          id: '5',
          type: SupportedEvent.Event,
          timeStart: 0,
          timeEnd: 10,
          duration: 10,
          revision: 1,
          delay: 0,
        } as OntimeEvent,
      ];

      const expected = [
        {
          id: '2',
          type: SupportedEvent.Event,
          timeStart: 0,
          timeEnd: 10,
          duration: 10,
          revision: 2,
          delay: 0,
        } as OntimeEvent,
        {
          id: '3',
          type: SupportedEvent.Event,
          timeStart: 10,
          timeEnd: 30,
          duration: 20,
          revision: 2,
          delay: 0,
        } as OntimeEvent,
        { id: '4', type: SupportedEvent.Block } as OntimeBlock,
        {
          id: '5',
          type: SupportedEvent.Event,
          timeStart: 0,
          timeEnd: 10,
          duration: 10,
          revision: 1,
          delay: 0,
        } as OntimeEvent,
      ];

      const updatedRundown = apply(delayId, testRundown);
      expect(updatedRundown).toStrictEqual(expected);
    });
    it('maintains constant duration', () => {
      const delayId = '1';
      const testRundown: OntimeRundown = [
        { id: delayId, type: SupportedEvent.Delay, duration: -30 } as OntimeDelay,
        {
          id: '2',
          type: SupportedEvent.Event,
          timeStart: 0,
          timeEnd: 10,
          duration: 10,
          revision: 1,
          delay: -30,
        } as OntimeEvent,
        {
          id: '3',
          type: SupportedEvent.Event,
          timeStart: 20,
          timeEnd: 40,
          duration: 20,
          revision: 1,
          delay: -30,
        } as OntimeEvent,
      ];

      const expected = [
        {
          id: '2',
          type: SupportedEvent.Event,
          timeStart: 0,
          timeEnd: 10,
          duration: 10,
          revision: 2,
          delay: 0,
        } as OntimeEvent,
        {
          id: '3',
          type: SupportedEvent.Event,
          timeStart: 0,
          timeEnd: 20,
          duration: 20,
          revision: 2,
          delay: 0,
        } as OntimeEvent,
      ];

      const updatedRundown = apply(delayId, testRundown);
      expect(updatedRundown).toStrictEqual(expected);
    });
  });
});
