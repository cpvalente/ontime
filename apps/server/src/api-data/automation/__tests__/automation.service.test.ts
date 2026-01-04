import { PlayableEvent, TimerLifeCycle } from 'ontime-types';

import { makeRuntimeStateData } from '../../../stores/__mocks__/runtimeState.mocks.js';
import { makeOntimeEvent } from '../../rundown/__mocks__/rundown.mocks.js';

import { deleteAllTriggers, addTrigger, addAutomation } from '../automation.dao.js';
import { testConditions, triggerAutomations } from '../automation.service.js';
import * as oscClient from '../clients/osc.client.js';
import * as httpClient from '../clients/http.client.js';

import { makeOSCAction, makeHTTPAction } from './testUtils.js';
import { runTestCondition } from './filterTestUtils.js';

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
      expect(runTestCondition('number', 10, 'equals', '10')).toBe(true);
      expect(runTestCondition('string', 'Title', 'equals', 'Title')).toBe(true);
    });

    it('should check if a value does not exist', () => {
      expect(runTestCondition('null/undefined', null, 'equals', '')).toBe(true);
    });

    it('should handle trueness boolean comparisons', () => {
      expect(runTestCondition('boolean', true, 'equals', 'true')).toBe(true);
      expect(runTestCondition('boolean', true, 'equals', 'false')).toBe(false);
    });

    it('should handle falseness boolean comparisons', () => {
      expect(runTestCondition('boolean', false, 'equals', 'false')).toBe(true);
      expect(runTestCondition('boolean', false, 'equals', 'true')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(runTestCondition('string', 'Title', 'equals', 'title')).toBe(true);
      expect(runTestCondition('boolean', true, 'equals', 'TRUE')).toBe(true);
    });

    it('should be false in other cases', () => {
      // Mismatched types
      expect(runTestCondition('number', 10, 'equals', 'lighting')).toBe(false);
      // Greater than / less than number
      expect(runTestCondition('number', 10, 'equals', '100')).toBe(false);
      expect(runTestCondition('number', 10, 'equals', '11')).toBe(false);
      expect(runTestCondition('number', 10, 'equals', '5')).toBe(false);
      expect(runTestCondition('number', 10, 'equals', '1')).toBe(false);
      // String / Substring
      expect(runTestCondition('string', 'testing-lighting-10', 'equals', 'lighting')).toBe(false);
      expect(runTestCondition('string', 'testing-lighting-10', 'equals', 'sound')).toBe(false);
      // Null / Empty / No value
      expect(runTestCondition('null/undefined', null, 'equals', 'not-empty')).toBe(false);
      expect(runTestCondition('boolean', false, 'equals', '')).toBe(false);

      expect(runTestCondition('number', 0, 'equals', '')).toBe(true); // TO_DO: is this the desired behavior?
    });
  });

  describe('not_equals operator', () => {
    it('should be false when comparing two equal number/string', () => {
      expect(runTestCondition('number', 10, 'not_equals', '10')).toBe(false);
      expect(runTestCondition('string', 'Title', 'not_equals', 'Title')).toBe(false);
    });

    it('should check if a value does not exist', () => {
      expect(runTestCondition('null/undefined', null, 'not_equals', '')).toBe(false);
    });

    it('should handle trueness boolean comparisons', () => {
      expect(runTestCondition('boolean', true, 'not_equals', 'true')).toBe(false);
      expect(runTestCondition('boolean', true, 'not_equals', 'false')).toBe(true);
    });

    it('should handle falseness boolean comparisons', () => {
      expect(runTestCondition('boolean', false, 'not_equals', 'false')).toBe(false);
      expect(runTestCondition('boolean', false, 'not_equals', 'true')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(runTestCondition('string', 'Title', 'not_equals', 'title')).toBe(false);
      expect(runTestCondition('boolean', true, 'not_equals', 'TRUE')).toBe(false);
    });

    it('should be true in other cases', () => {
      // Mismatched types
      expect(runTestCondition('number', 10, 'not_equals', 'lighting')).toBe(true);
      // Greater than / less than number
      expect(runTestCondition('number', 10, 'not_equals', '100')).toBe(true);
      expect(runTestCondition('number', 10, 'not_equals', '11')).toBe(true);
      expect(runTestCondition('number', 10, 'not_equals', '5')).toBe(true);
      expect(runTestCondition('number', 10, 'not_equals', '1')).toBe(true);
      // String / Substring
      expect(runTestCondition('string', 'testing-lighting-10', 'not_equals', 'lighting')).toBe(true);
      expect(runTestCondition('string', 'testing-lighting-10', 'not_equals', 'sound')).toBe(true);
      // Null / Empty / No value
      expect(runTestCondition('null/undefined', null, 'not_equals', 'not-empty')).toBe(true);
      expect(runTestCondition('boolean', false, 'not_equals', '')).toBe(true);

      expect(runTestCondition('number', 0, 'not_equals', '')).toBe(false); // TO_DO: is this the desired behavior?
    });
  });

  describe('greater_than operator', () => {
    it('should check if the given value is smaller', () => {
      expect(runTestCondition('number', 10, 'greater_than', '10')).toBe(false);
      expect(runTestCondition('number', 10, 'greater_than', '100')).toBe(false);
      expect(runTestCondition('number', 10, 'greater_than', '11')).toBe(false);
      expect(runTestCondition('number', 10, 'greater_than', '5')).toBe(true);
      expect(runTestCondition('number', 10, 'greater_than', '1')).toBe(true);
    });
    it('should handle values which are not numbers', () => {
      // Mismatched types / Empty / No value
      expect(runTestCondition('number', 10, 'greater_than', 'lighting')).toBe(false);
      expect(runTestCondition('number', 0, 'greater_than', '')).toBe(false);
      // Other types
      expect(runTestCondition('string', 'Title', 'greater_than', 'Title')).toBe(false);
      expect(runTestCondition('null/undefined', null, 'greater_than', '')).toBe(false);
      expect(runTestCondition('boolean', true, 'greater_than', 'true')).toBe(false);
      expect(runTestCondition('boolean', true, 'greater_than', 'false')).toBe(false);
      expect(runTestCondition('boolean', false, 'greater_than', 'false')).toBe(false);
      expect(runTestCondition('boolean', false, 'greater_than', 'true')).toBe(false);
      expect(runTestCondition('string', 'Title', 'greater_than', 'title')).toBe(false);
      expect(runTestCondition('boolean', true, 'greater_than', 'TRUE')).toBe(false);
      expect(runTestCondition('string', 'testing-lighting-10', 'greater_than', 'lighting')).toBe(false);
      expect(runTestCondition('string', 'testing-lighting-10', 'greater_than', 'sound')).toBe(false);
      expect(runTestCondition('null/undefined', null, 'greater_than', 'not-empty')).toBe(false);
      expect(runTestCondition('boolean', false, 'greater_than', '')).toBe(false);
    });
  });

  describe('less_than operator', () => {
    it('should check if the given value is larger', () => {
      expect(runTestCondition('number', 10, 'less_than', '100')).toBe(true);
      expect(runTestCondition('number', 10, 'less_than', '11')).toBe(true);
      expect(runTestCondition('number', 10, 'less_than', '10')).toBe(false);
      expect(runTestCondition('number', 10, 'less_than', '5')).toBe(false);
      expect(runTestCondition('number', 10, 'less_than', '1')).toBe(false);
    });
    it('should handle values which are not numbers', () => {
      // Mismatched types / Empty / No value
      expect(runTestCondition('number', 10, 'less_than', 'lighting')).toBe(false);
      expect(runTestCondition('number', 0, 'less_than', '')).toBe(false);
      // Other types
      expect(runTestCondition('string', 'Title', 'less_than', 'Title')).toBe(false);
      expect(runTestCondition('null/undefined', null, 'less_than', '')).toBe(false);
      expect(runTestCondition('boolean', true, 'less_than', 'true')).toBe(false);
      expect(runTestCondition('boolean', true, 'less_than', 'false')).toBe(false);
      expect(runTestCondition('boolean', false, 'less_than', 'false')).toBe(false);
      expect(runTestCondition('boolean', false, 'less_than', 'true')).toBe(false);
      expect(runTestCondition('string', 'Title', 'less_than', 'title')).toBe(false);
      expect(runTestCondition('boolean', true, 'less_than', 'TRUE')).toBe(false);
      expect(runTestCondition('string', 'testing-lighting-10', 'less_than', 'lighting')).toBe(false);
      expect(runTestCondition('string', 'testing-lighting-10', 'less_than', 'sound')).toBe(false);
      expect(runTestCondition('null/undefined', null, 'less_than', 'not-empty')).toBe(false);
      expect(runTestCondition('boolean', false, 'less_than', '')).toBe(false);
    });
  });

  describe('contains operator', () => {
    it('should check if value contains given string', () => {
      expect(runTestCondition('string', 'testing-lighting-10', 'contains', 'lighting')).toBe(true);
      expect(runTestCondition('string', 'testing-lighting-10', 'contains', '10')).toBe(true);
      expect(runTestCondition('string', 'testing-lighting-10', 'contains', '1')).toBe(true);
      expect(runTestCondition('string', 'testing-lighting-10', 'contains', 'sound')).toBe(false);
    });

    it('should match with equals string', () => {
      expect(runTestCondition('string', '', 'contains', '')).toBe(true);
      expect(runTestCondition('string', 'Title', 'contains', 'Title')).toBe(true);
    });

    it('should handle case sensitivity', () => {
      // TO_DO: is this the desired behavior?
      expect(runTestCondition('string', 'Title', 'contains', 'title')).toBe(false);
    });

    it('should handle non-string equals values', () => {
      //TO_DO: is this the desired behavior? All the fields contain the value when converted to string.
      expect(runTestCondition('number', 10, 'contains', '10')).toBe(false);
      expect(runTestCondition('boolean', true, 'contains', 'true')).toBe(false);
      expect(runTestCondition('boolean', false, 'contains', 'false')).toBe(false);
    });

    it('should handle number values contained in field number', () => {
      expect(runTestCondition('number', 12345, 'contains', '234')).toBe(false); // TO_DO: is this the desired behavior?
      expect(runTestCondition('number', 12345, 'contains', '456')).toBe(false);
    });
  });

  describe('not_contains operator', () => {
    it("should check if value doesn't contains given string", () => {
      expect(runTestCondition('string', 'testing-lighting-10', 'not_contains', 'lighting')).toBe(false);
      expect(runTestCondition('string', 'testing-lighting-10', 'not_contains', '10')).toBe(false);
      expect(runTestCondition('string', 'testing-lighting-10', 'not_contains', '1')).toBe(false);
      expect(runTestCondition('string', 'testing-lighting-10', 'not_contains', 'sound')).toBe(true);
    });

    it('should not match with equals string', () => {
      expect(runTestCondition('string', '', 'not_contains', '')).toBe(false);
      expect(runTestCondition('string', 'Title', 'not_contains', 'Title')).toBe(false);
    });

    it('should handle case sensitivity', () => {
      // TO_DO: is this the desired behavior?
      expect(runTestCondition('string', 'Title', 'not_contains', 'title')).toBe(true);
    });

    it('should handle non-string equals values', () => {
      expect(runTestCondition('number', 10, 'not_contains', '10')).toBe(false);
      expect(runTestCondition('boolean', true, 'not_contains', 'true')).toBe(false);
      expect(runTestCondition('boolean', false, 'not_contains', 'false')).toBe(false);
    });

    it('should handle number values contained in field number', () => {
      expect(runTestCondition('number', 12345, 'not_contains', '234')).toBe(false);
      expect(runTestCondition('number', 12345, 'not_contains', '456')).toBe(false); // TO_DO: is this the desired behavior?
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
