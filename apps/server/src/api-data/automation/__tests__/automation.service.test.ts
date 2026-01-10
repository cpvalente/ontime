import { PlayableEvent, TimerLifeCycle } from 'ontime-types';

import { makeRuntimeStateData } from '../../../stores/__mocks__/runtimeState.mocks.js';
import { makeOntimeEvent } from '../../rundown/__mocks__/rundown.mocks.js';

import { deleteAllTriggers, addTrigger, addAutomation } from '../automation.dao.js';
import { testConditions, triggerAutomations } from '../automation.service.js';
import * as oscClient from '../clients/osc.client.js';
import * as httpClient from '../clients/http.client.js';

import { makeOSCAction, makeHTTPAction } from './testUtils.js';

beforeAll(() => {
  vi.mock('../../../classes/data-provider/DataProvider.js', () => {
    // Create a small mock store
    let automations = {
      enabledAutomations: true,
      enabledOscIn: true,
      oscPortIn: 8888,
      triggers: [],
      automations: {},
    };
    return {
      getDataProvider: vi.fn().mockImplementation(() => {
        return {
          getAutomation: vi.fn().mockImplementation(() => automations),
          setAutomation: vi.fn().mockImplementation((newData) => (automations = newData)),
        };
      }),
    };
  });
});

afterAll(() => {
  vi.clearAllMocks();
});

describe('triggerAction()', () => {
  let oscSpy = vi.spyOn(oscClient, 'emitOSC');
  let httpSpy = vi.spyOn(httpClient, 'emitHTTP');

  beforeEach(async () => {
    oscSpy = vi.spyOn(oscClient, 'emitOSC').mockImplementation(() => {});
    httpSpy = vi.spyOn(httpClient, 'emitHTTP').mockImplementation(() => {});

    await deleteAllTriggers();
    const oscAutomation = await addAutomation({
      title: 'test-osc',
      filterRule: 'all',
      filters: [],
      outputs: [makeOSCAction()],
    });
    const httpAutomation = await addAutomation({
      title: 'test-http',
      filterRule: 'any',
      filters: [],
      outputs: [makeHTTPAction()],
    });
    await addTrigger({
      title: 'test-osc',
      trigger: TimerLifeCycle.onLoad,
      automationId: oscAutomation.id,
    });
    await addTrigger({
      title: 'test-http',
      trigger: TimerLifeCycle.onFinish,
      automationId: httpAutomation.id,
    });
  });

  it('should trigger automations for a given action', () => {
    const state = makeRuntimeStateData();
    triggerAutomations(TimerLifeCycle.onLoad, state);
    expect(oscSpy).toHaveBeenCalledTimes(1);
    expect(httpSpy).not.toBeCalled();
    oscSpy.mockReset();
    httpSpy.mockReset();

    triggerAutomations(TimerLifeCycle.onStart, state);
    expect(oscClient.emitOSC).not.toBeCalled();
    expect(httpSpy).not.toBeCalled();
    oscSpy.mockReset();
    httpSpy.mockReset();

    triggerAutomations(TimerLifeCycle.onFinish, state);
    expect(oscSpy).not.toBeCalled();
    expect(httpSpy).toHaveBeenCalledTimes(1);
    oscSpy.mockReset();
    httpSpy.mockReset();

    triggerAutomations(TimerLifeCycle.onStop, state);
    expect(oscSpy).not.toBeCalled();
    expect(httpSpy).not.toBeCalled();
  });
});

describe('testConditions()', () => {
  it('should return true when no filters are provided', () => {
    const result = testConditions([], 'all', {});
    expect(result).toBe(true);
  });

  describe('equals operator', () => {
    it('should be true when comparing two equal number/string', () => {
      // Test Conditions (State type: number) [10 'equals' '10'] = true
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'equals',
              value: '10',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(true);

      // Test Conditions (State type: string) ['Title' 'equals' 'Title'] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'equals',
              value: 'Title',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'Title',
            } as PlayableEvent,
          }),
        ),
      ).toBe(true);
    });

    it('should check if a value does not exist', () => {
      // Test Conditions (State type: 'null/undefined') [null 'equals' ''] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'equals',
              value: '',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: null }),
        ),
      ).toBe(true);
    });

    it('should handle trueness boolean comparisons', () => {
      // Test Conditions (State type: boolean) [true 'equals' 'true'] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'equals',
              value: 'true',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: true } as PlayableEvent }),
        ),
      ).toBe(true);

      // Test Conditions (State type: boolean) [true 'equals' 'false'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'equals',
              value: 'false',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: true } as PlayableEvent }),
        ),
      ).toBe(false);
    });

    it('should handle falseness boolean comparisons', () => {
      // Test Conditions (State type: boolean) [false 'equals' 'false'] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'equals',
              value: 'false',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: false } as PlayableEvent }),
        ),
      ).toBe(true);

      // Test Conditions (State type: boolean) [false 'equals' 'true'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'equals',
              value: 'true',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: false } as PlayableEvent }),
        ),
      ).toBe(false);
    });

    it('should be case insensitive', () => {
      // Test Conditions (State type: string) ['Title' 'equals' 'title'] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'equals',
              value: 'title',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'Title',
            } as PlayableEvent,
          }),
        ),
      ).toBe(true);

      // Test Conditions (State type: boolean) [true 'equals' 'TRUE'] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'equals',
              value: 'TRUE',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: true } as PlayableEvent }),
        ),
      ).toBe(true);
    });

    it('should be false in other cases', () => {
      // Mismatched types

      // Test Conditions (State type: number) [10 'equals' 'lighting'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'equals',
              value: 'lighting',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(false);
      // Greater than / less than number

      // Test Conditions (State type: number) [10 'equals' '100'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'equals',
              value: '100',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(false);

      // Test Conditions (State type: number) [10 'equals' '11'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'equals',
              value: '11',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(false);

      // Test Conditions (State type: number) [10 'equals' '5'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'equals',
              value: '5',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(false);

      // Test Conditions (State type: number) [10 'equals' '1'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'equals',
              value: '1',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(false);
      // String / Substring

      // Test Conditions (State type: string) ['testing-lighting-10' 'equals' 'lighting'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'equals',
              value: 'lighting',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'testing-lighting-10',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);

      // Test Conditions (State type: string) ['testing-lighting-10' 'equals' 'sound'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'equals',
              value: 'sound',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'testing-lighting-10',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);
      // Null / Empty / No value

      // Test Conditions (State type: 'null/undefined') [null 'equals' 'not-empty'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'equals',
              value: 'not-empty',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: null }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [false 'equals' ''] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'equals',
              value: '',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: false } as PlayableEvent }),
        ),
      ).toBe(false);

      // Test Conditions (State type: number) [0 'equals' ''] = true
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'equals',
              value: '',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 0 }),
        ),
      ).toBe(true); // TO_DO: is this the desired behavior?
    });
  });

  describe('not_equals operator', () => {
    it('should be false when comparing two equal number/string', () => {
      // Test Conditions (State type: number) [10 'not_equals' '10'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'not_equals',
              value: '10',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(false);

      // Test Conditions (State type: string) ['Title' 'not_equals' 'Title'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'not_equals',
              value: 'Title',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'Title',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);
    });

    it('should check if a value does not exist', () => {
      // Test Conditions (State type: 'null/undefined') [null 'not_equals' ''] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'not_equals',
              value: '',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: null }),
        ),
      ).toBe(false);
    });

    it('should handle trueness boolean comparisons', () => {
      // Test Conditions (State type: boolean) [true 'not_equals' 'true'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'not_equals',
              value: 'true',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: true } as PlayableEvent }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [true 'not_equals' 'false'] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'not_equals',
              value: 'false',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: true } as PlayableEvent }),
        ),
      ).toBe(true);
    });

    it('should handle falseness boolean comparisons', () => {
      // Test Conditions (State type: boolean) [false 'not_equals' 'false'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'not_equals',
              value: 'false',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: false } as PlayableEvent }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [false 'not_equals' 'true'] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'not_equals',
              value: 'true',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: false } as PlayableEvent }),
        ),
      ).toBe(true);
    });

    it('should be case insensitive', () => {
      // Test Conditions (State type: string) ['Title' 'not_equals' 'title'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'not_equals',
              value: 'title',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'Title',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [true 'not_equals' 'TRUE'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'not_equals',
              value: 'TRUE',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: true } as PlayableEvent }),
        ),
      ).toBe(false);
    });

    it('should be true in other cases', () => {
      // Mismatched types

      // Test Conditions (State type: number) [10 'not_equals' 'lighting'] = true
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'not_equals',
              value: 'lighting',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(true);
      // Greater than / less than number

      // Test Conditions (State type: number) [10 'not_equals' '100'] = true
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'not_equals',
              value: '100',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(true);

      // Test Conditions (State type: number) [10 'not_equals' '11'] = true
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'not_equals',
              value: '11',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(true);

      // Test Conditions (State type: number) [10 'not_equals' '5'] = true
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'not_equals',
              value: '5',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(true);

      // Test Conditions (State type: number) [10 'not_equals' '1'] = true
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'not_equals',
              value: '1',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(true);
      // String / Substring

      // Test Conditions (State type: string) ['testing-lighting-10' 'not_equals' 'lighting'] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'not_equals',
              value: 'lighting',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'testing-lighting-10',
            } as PlayableEvent,
          }),
        ),
      ).toBe(true);

      // Test Conditions (State type: string) ['testing-lighting-10' 'not_equals' 'sound'] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'not_equals',
              value: 'sound',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'testing-lighting-10',
            } as PlayableEvent,
          }),
        ),
      ).toBe(true);
      // Null / Empty / No value

      // Test Conditions (State type: 'null/undefined') [null 'not_equals' 'not-empty'] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'not_equals',
              value: 'not-empty',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: null }),
        ),
      ).toBe(true);

      // Test Conditions (State type: boolean) [false 'not_equals' ''] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'not_equals',
              value: '',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: false } as PlayableEvent }),
        ),
      ).toBe(true);

      // Test Conditions (State type: number) [0 'not_equals' ''] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'not_equals',
              value: '',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 0 }),
        ),
      ).toBe(false); // TO_DO: is this the desired behavior?
    });
  });

  describe('greater_than operator', () => {
    it('should check if the given value is smaller', () => {
      // Test Conditions (State type: number) [10 'greater_than' '10'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'greater_than',
              value: '10',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(false);

      // Test Conditions (State type: number) [10 'greater_than' '100'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'greater_than',
              value: '100',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(false);

      // Test Conditions (State type: number) [10 'greater_than' '11'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'greater_than',
              value: '11',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(false);

      // Test Conditions (State type: number) [10 'greater_than' '5'] = true
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'greater_than',
              value: '5',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(true);

      // Test Conditions (State type: number) [10 'greater_than' '1'] = true
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'greater_than',
              value: '1',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(true);
    });
    it('should handle values which are not numbers', () => {
      // Mismatched types / Empty / No value

      // Test Conditions (State type: number) [10 'greater_than' 'lighting'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'greater_than',
              value: 'lighting',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(false);

      // Test Conditions (State type: number) [0 'greater_than' ''] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'greater_than',
              value: '',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 0 }),
        ),
      ).toBe(false);
      // Other types

      // Test Conditions (State type: string) ['Title' 'greater_than' 'Title'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'greater_than',
              value: 'Title',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'Title',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);

      // Test Conditions (State type: 'null/undefined') [null 'greater_than' ''] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'greater_than',
              value: '',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: null }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [true 'greater_than' 'true'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'greater_than',
              value: 'true',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: true } as PlayableEvent }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [true 'greater_than' 'false'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'greater_than',
              value: 'false',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: true } as PlayableEvent }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [false 'greater_than' 'false'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'greater_than',
              value: 'false',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: false } as PlayableEvent }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [false 'greater_than' 'true'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'greater_than',
              value: 'true',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: false } as PlayableEvent }),
        ),
      ).toBe(false);

      // Test Conditions (State type: string) ['Title' 'greater_than' 'title'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'greater_than',
              value: 'title',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'Title',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [true 'greater_than' 'TRUE'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'greater_than',
              value: 'TRUE',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: true } as PlayableEvent }),
        ),
      ).toBe(false);

      // Test Conditions (State type: string) ['testing-lighting-10' 'greater_than' 'lighting'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'greater_than',
              value: 'lighting',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'testing-lighting-10',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);

      // Test Conditions (State type: string) ['testing-lighting-10' 'greater_than' 'sound'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'greater_than',
              value: 'sound',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'testing-lighting-10',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);

      // Test Conditions (State type: 'null/undefined') [null 'greater_than' 'not-empty'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'greater_than',
              value: 'not-empty',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: null }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [false 'greater_than' ''] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'greater_than',
              value: '',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: false } as PlayableEvent }),
        ),
      ).toBe(false);
    });
  });

  describe('less_than operator', () => {
    it('should check if the given value is larger', () => {
      // Test Conditions (State type: number) [10 'less_than' '100'] = true
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'less_than',
              value: '100',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(true);

      // Test Conditions (State type: number) [10 'less_than' '11'] = true
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'less_than',
              value: '11',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(true);

      // Test Conditions (State type: number) [10 'less_than' '10'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'less_than',
              value: '10',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(false);

      // Test Conditions (State type: number) [10 'less_than' '5'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'less_than',
              value: '5',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(false);

      // Test Conditions (State type: number) [10 'less_than' '1'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'less_than',
              value: '1',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(false);
    });
    it('should handle values which are not numbers', () => {
      // Mismatched types / Empty / No value

      // Test Conditions (State type: number) [10 'less_than' 'lighting'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'less_than',
              value: 'lighting',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(false);

      // Test Conditions (State type: number) [0 'less_than' ''] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'less_than',
              value: '',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 0 }),
        ),
      ).toBe(false);
      // Other types

      // Test Conditions (State type: string) ['Title' 'less_than' 'Title'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'less_than',
              value: 'Title',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'Title',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);

      // Test Conditions (State type: 'null/undefined') [null 'less_than' ''] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'less_than',
              value: '',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: null }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [true 'less_than' 'true'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'less_than',
              value: 'true',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: true } as PlayableEvent }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [true 'less_than' 'false'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'less_than',
              value: 'false',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: true } as PlayableEvent }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [false 'less_than' 'false'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'less_than',
              value: 'false',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: false } as PlayableEvent }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [false 'less_than' 'true'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'less_than',
              value: 'true',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: false } as PlayableEvent }),
        ),
      ).toBe(false);

      // Test Conditions (State type: string) ['Title' 'less_than' 'title'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'less_than',
              value: 'title',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'Title',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [true 'less_than' 'TRUE'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'less_than',
              value: 'TRUE',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: true } as PlayableEvent }),
        ),
      ).toBe(false);

      // Test Conditions (State type: string) ['testing-lighting-10' 'less_than' 'lighting'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'less_than',
              value: 'lighting',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'testing-lighting-10',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);

      // Test Conditions (State type: string) ['testing-lighting-10' 'less_than' 'sound'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'less_than',
              value: 'sound',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'testing-lighting-10',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);

      // Test Conditions (State type: 'null/undefined') [null 'less_than' 'not-empty'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'less_than',
              value: 'not-empty',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: null }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [false 'less_than' ''] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'less_than',
              value: '',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: false } as PlayableEvent }),
        ),
      ).toBe(false);
    });
  });

  describe('contains operator', () => {
    it('should check if value contains given string', () => {
      // Test Conditions (State type: string) ['testing-lighting-10' 'contains' 'lighting'] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'contains',
              value: 'lighting',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'testing-lighting-10',
            } as PlayableEvent,
          }),
        ),
      ).toBe(true);

      // Test Conditions (State type: string) ['testing-lighting-10' 'contains' '10'] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'contains',
              value: '10',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'testing-lighting-10',
            } as PlayableEvent,
          }),
        ),
      ).toBe(true);

      // Test Conditions (State type: string) ['testing-lighting-10' 'contains' '1'] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'contains',
              value: '1',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'testing-lighting-10',
            } as PlayableEvent,
          }),
        ),
      ).toBe(true);

      // Test Conditions (State type: string) ['testing-lighting-10' 'contains' 'sound'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'contains',
              value: 'sound',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'testing-lighting-10',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);
    });

    it('should match with equals string', () => {
      // Test Conditions (State type: string) ['' 'contains' ''] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'contains',
              value: '',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: '',
            } as PlayableEvent,
          }),
        ),
      ).toBe(true);

      // Test Conditions (State type: string) ['Title' 'contains' 'Title'] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'contains',
              value: 'Title',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'Title',
            } as PlayableEvent,
          }),
        ),
      ).toBe(true);
    });

    it('should handle case sensitivity', () => {
      // TO_DO: is this the desired behavior?

      // Test Conditions (State type: string) ['Title' 'contains' 'title'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'contains',
              value: 'title',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'Title',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);
    });

    it('should handle non-string equals values', () => {
      //TO_DO: is this the desired behavior? All the fields contain the value when converted to string.

      // Test Conditions (State type: number) [10 'contains' '10'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'contains',
              value: '10',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [true 'contains' 'true'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'contains',
              value: 'true',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: true } as PlayableEvent }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [false 'contains' 'false'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'contains',
              value: 'false',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: false } as PlayableEvent }),
        ),
      ).toBe(false);
    });

    it('should handle number values contained in field number', () => {
      // Test Conditions (State type: number) [12345 'contains' '234'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'contains',
              value: '234',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 12345 }),
        ),
      ).toBe(false); // TO_DO: is this the desired behavior?

      // Test Conditions (State type: number) [12345 'contains' '456'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'contains',
              value: '456',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 12345 }),
        ),
      ).toBe(false);
    });
  });

  describe('not_contains operator', () => {
    it("should check if value doesn't contains given string", () => {
      // Test Conditions (State type: string) ['testing-lighting-10' 'not_contains' 'lighting'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'not_contains',
              value: 'lighting',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'testing-lighting-10',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);

      // Test Conditions (State type: string) ['testing-lighting-10' 'not_contains' '10'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'not_contains',
              value: '10',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'testing-lighting-10',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);

      // Test Conditions (State type: string) ['testing-lighting-10' 'not_contains' '1'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'not_contains',
              value: '1',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'testing-lighting-10',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);

      // Test Conditions (State type: string) ['testing-lighting-10' 'not_contains' 'sound'] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'not_contains',
              value: 'sound',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'testing-lighting-10',
            } as PlayableEvent,
          }),
        ),
      ).toBe(true);
    });

    it('should not match with equals string', () => {
      // Test Conditions (State type: string) ['' 'not_contains' ''] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'not_contains',
              value: '',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: '',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);

      // Test Conditions (State type: string) ['Title' 'not_contains' 'Title'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'not_contains',
              value: 'Title',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'Title',
            } as PlayableEvent,
          }),
        ),
      ).toBe(false);
    });

    it('should handle case sensitivity', () => {
      // TO_DO: is this the desired behavior?

      // Test Conditions (State type: string) ['Title' 'not_contains' 'title'] = true
      expect(
        testConditions(
          [
            {
              field: 'eventNow.title',
              operator: 'not_contains',
              value: 'title',
            },
          ],
          'all',
          makeRuntimeStateData({
            eventNow: {
              title: 'Title',
            } as PlayableEvent,
          }),
        ),
      ).toBe(true);
    });

    it('should handle non-string equals values', () => {
      // Test Conditions (State type: number) [10 'not_contains' '10'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'not_contains',
              value: '10',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 10 }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [true 'not_contains' 'true'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'not_contains',
              value: 'true',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: true } as PlayableEvent }),
        ),
      ).toBe(false);

      // Test Conditions (State type: boolean) [false 'not_contains' 'false'] = false
      expect(
        testConditions(
          [
            {
              field: 'eventNow.countToEnd',
              operator: 'not_contains',
              value: 'false',
            },
          ],
          'all',
          makeRuntimeStateData({ eventNow: { countToEnd: false } as PlayableEvent }),
        ),
      ).toBe(false);
    });

    it('should handle number values contained in field number', () => {
      // Test Conditions (State type: number) [12345 'not_contains' '234'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'not_contains',
              value: '234',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 12345 }),
        ),
      ).toBe(false);

      // Test Conditions (State type: number) [12345 'not_contains' '456'] = false
      expect(
        testConditions(
          [
            {
              field: 'clock',
              operator: 'not_contains',
              value: '456',
            },
          ],
          'all',
          makeRuntimeStateData({ clock: 12345 }),
        ),
      ).toBe(false); // TO_DO: is this the desired behavior?
    });
  });

  describe('for all filter rule', () => {
    it('should return true when all filters are true', () => {
      const mockStore = makeRuntimeStateData({
        clock: 10,
        eventNow: makeOntimeEvent({
          title: 'test',
          custom: { av: 'av-value' },
        }) as PlayableEvent,
      });
      const result = testConditions(
        [
          { field: 'clock', operator: 'equals', value: '10' },
          { field: 'eventNow.title', operator: 'equals', value: 'test' },
          { field: 'eventNow.custom.av', operator: 'equals', value: 'av-value' },
        ],
        'all',
        mockStore,
      );
      expect(result).toBe(true);
    });

    it('should return false if any filters are false', () => {
      const mockStore = makeRuntimeStateData({
        clock: 10,
        eventNow: makeOntimeEvent({
          title: 'test',
          custom: { av: 'not-av-value' },
        }) as PlayableEvent,
      });
      const result = testConditions(
        [
          { field: 'clock', operator: 'equals', value: '11' },
          { field: 'eventNow.title', operator: 'equals', value: 'test' },
          { field: 'eventNow.custom.av', operator: 'equals', value: 'av-value' },
        ],
        'all',
        mockStore,
      );
      expect(result).toBe(false);
    });
  });

  describe('for any filter rule', () => {
    it('should return true when all filters are true', () => {
      const mockStore = makeRuntimeStateData({
        clock: 10,
        eventNow: makeOntimeEvent({
          title: 'test',
          custom: { av: 'av-value' },
        }) as PlayableEvent,
      });
      const result = testConditions(
        [
          { field: 'clock', operator: 'equals', value: '10' },
          { field: 'eventNow.title', operator: 'equals', value: 'test' },
          { field: 'eventNow.custom.av', operator: 'equals', value: 'av-value' },
        ],
        'any',
        mockStore,
      );
      expect(result).toBe(true);
    });

    it('should return true if any filters are true', () => {
      const mockStore = makeRuntimeStateData({
        clock: 10,
        eventNow: makeOntimeEvent({
          title: 'not-test',
          custom: { av: 'av-value' },
        }) as PlayableEvent,
      });
      const result = testConditions(
        [
          { field: 'clock', operator: 'equals', value: '11' },
          { field: 'eventNow.title', operator: 'equals', value: 'not-test' },
          { field: 'eventNow.custom.av', operator: 'equals', value: 'av-value' },
        ],
        'any',
        mockStore,
      );
      expect(result).toBe(true);
    });

    it('should return false if all filters are false', () => {
      const mockStore = makeRuntimeStateData({
        clock: 10,
        eventNow: makeOntimeEvent({ title: 'test' }) as PlayableEvent,
      });
      const result = testConditions(
        [
          { field: 'clock', operator: 'equals', value: '11' },
          { field: 'eventNow.title', operator: 'equals', value: 'not-test' },
        ],
        'any',
        mockStore,
      );
      expect(result).toBe(false);
    });
  });
});
