import { PlayableEvent, TimerLifeCycle } from 'ontime-types';

import { makeRuntimeStateData } from '../../../stores/__mocks__/runtimeState.mocks.js';
import { makeOntimeEvent } from '../../rundown/__mocks__/rundown.mocks.js';

import { deleteAllTriggers, addTrigger, addAutomation } from '../automation.dao.js';
import { testConditions, triggerAutomations } from '../automation.service.js';
import * as oscClient from '../clients/osc.client.js';
import * as httpClient from '../clients/http.client.js';

import { makeOSCAction, makeHTTPAction } from './testUtils.js';
import { RuntimeState } from '../../../stores/runtimeState.js';

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

  describe('equals', () => {
    test.each([
      {
        description: 'number and string number',
        value: '10',
        state: 10,
      },
      {
        description: 'string and string',
        value: 'Title',
        state: 'Title',
      },
      {
        description: 'null and empty string',
        value: '',
        state: null,
      },
      {
        description: 'undefined and empty string',
        value: '',
        state: undefined,
      },
      {
        description: 'boolean true and string true',
        value: 'true',
        state: true,
      },
      {
        description: 'boolean false equals string false',
        value: 'false',
        state: false,
      },
      {
        description: 'not case sensitive for strings',
        value: 'title',
        state: 'Title',
      },
      {
        description: 'not case sensitive for booleans',
        value: 'TRUE',
        state: true,
      },
    ])('$description', ({ value, state }) => {
      expect(
        testConditions([{ field: 'test.path', operator: 'equals', value }], 'all', {
          test: { path: state },
        } as unknown as RuntimeState),
      ).toBe(true);
      expect(
        testConditions([{ field: 'test.path', operator: 'not_equals', value }], 'all', {
          test: { path: state },
        } as unknown as RuntimeState),
      ).toBe(false);
    });
  });

  describe('not_equals', () => {
    test.each([
      {
        description: 'boolean true and string false',
        value: 'false',
        state: true,
      },
      {
        description: 'boolean false and string true',
        value: 'true',
        state: false,
      },
      {
        description: 'number and non-numeric string',
        value: 'lighting',
        state: 10,
      },
      {
        description: 'number and different number',
        value: '100',
        state: 10,
      },
      {
        description: '10 and 11',
        value: '11',
        state: 10,
      },
      {
        description: '10 and 5',
        value: '5',
        state: 10,
      },
      {
        description: '10 and 1',
        value: '1',
        state: 10,
      },
      {
        description: 'string and substring',
        value: 'lighting',
        state: 'testing-lighting-10',
      },
      {
        description: 'string and different string',
        value: 'sound',
        state: 'testing-lighting-10',
      },
      {
        description: 'null and non-empty string',
        value: 'not-empty',
        state: null,
      },
      {
        description: 'undefined and non-empty string',
        value: 'not-empty',
        state: undefined,
      },
      {
        description: 'undefined and " " string',
        value: ' ',
        state: undefined,
      },
      {
        description: 'boolean false and empty string',
        value: '',
        state: false,
      },
      {
        description: '0 and empty string',
        value: '',
        state: 0,
      },
    ])('$description', ({ value, state }) => {
      expect(
        testConditions([{ field: 'test.path', operator: 'not_equals', value }], 'all', {
          test: { path: state },
        } as unknown as RuntimeState),
      ).toBe(true);
      expect(
        testConditions([{ field: 'test.path', operator: 'equals', value }], 'all', {
          test: { path: state },
        } as unknown as RuntimeState),
      ).toBe(false);
    });
  });

  describe('greater_than', () => {
    test.each([
      {
        description: '10 > 5',
        value: '5',
        state: 10,
      },
      {
        description: '10 > 1',
        value: '1',
        state: 10,
      },
      {
        description: '100 > 5',
        value: '5',
        state: 100,
      },
      {
        description: '11 > 10',
        value: '10',
        state: 11,
      },
      {
        description: '0 > -1',
        value: '-1',
        state: 0,
      },
      {
        description: '-100 > -150',
        value: '-150',
        state: -100,
      },
    ])('$description', ({ value, state }) => {
      expect(
        testConditions([{ field: 'test.path', operator: 'greater_than', value }], 'all', {
          test: { path: state },
        } as unknown as RuntimeState),
      ).toBe(true);
      expect(
        testConditions([{ field: 'test.path', operator: 'less_than', value }], 'all', {
          test: { path: state },
        } as unknown as RuntimeState),
      ).toBe(false);
    });
  });

  describe('less_than', () => {
    test.each([
      {
        description: '10 > 5',
        value: '10',
        state: 5,
      },
      {
        description: '10 > 1',
        value: '10',
        state: 1,
      },
      {
        description: '100 > 5',
        value: '100',
        state: 5,
      },
      {
        description: '11 > 10',
        value: '11',
        state: 10,
      },
      {
        description: '0 > -1',
        value: '0',
        state: -1,
      },
      {
        description: '-100 > -150',
        value: '-100',
        state: -150,
      },
    ])('$description', ({ value, state }) => {
      expect(
        testConditions([{ field: 'test.path', operator: 'less_than', value }], 'all', {
          test: { path: state },
        } as unknown as RuntimeState),
      ).toBe(true);
      expect(
        testConditions([{ field: 'test.path', operator: 'greater_than', value }], 'all', {
          test: { path: state },
        } as unknown as RuntimeState),
      ).toBe(false);
    });
  });

  describe('invalid and edge case for greater/less_than', () => {
    test.each([
      {
        description: 'number and non-numeric string',
        value: 'lighting',
        state: 10,
      },
      {
        description: '0 and empty string',
        value: '',
        state: 0,
      },
      {
        description: 'equal values',
        value: '10',
        state: 10,
      },
      {
        description: 'boolean false and empty string',
        value: '',
        state: false,
      },
      {
        description: 'undefined and non-empty string',
        value: 'not-empty',
        state: undefined,
      },
      {
        description: 'null and non-empty string',
        value: 'not-empty',
        state: null,
      },
      {
        description: 'string and different string',
        value: 'sound',
        state: 'testing-lighting-10',
      },
      {
        description: 'string and substring',
        value: 'lighting',
        state: 'testing-lighting-10',
      },
      {
        description: 'boolean true and uppercase TRUE',
        value: 'TRUE',
        state: true,
      },
      {
        description: 'string and lowercase string',
        value: 'title',
        state: 'Title',
      },
      {
        description: 'boolean false and string true',
        value: 'true',
        state: false,
      },
      {
        description: 'boolean false and string false',
        value: 'false',
        state: false,
      },
      {
        description: 'boolean true and string false',
        value: 'false',
        state: true,
      },
      {
        description: 'string and string',
        value: 'Title',
        state: 'Title',
      },
      {
        description: 'null and empty string',
        value: '',
        state: null,
      },
      {
        description: 'undefined and empty string',
        value: '',
        state: undefined,
      },
      {
        description: 'boolean true and string true',
        value: 'true',
        state: true,
      },
    ])('$description', ({ value, state }) => {
      expect(
        testConditions([{ field: 'test.path', operator: 'less_than', value }], 'all', {
          test: { path: state },
        } as unknown as RuntimeState),
      ).toBe(false);
      expect(
        testConditions([{ field: 'test.path', operator: 'greater_than', value }], 'all', {
          test: { path: state },
        } as unknown as RuntimeState),
      ).toBe(false);
    });
  });

  describe('contains', () => {
    test.each([
      {
        description: 'substring in string',
        value: 'lighting',
        state: 'testing-lighting-10',
      },
      {
        description: 'number in string',
        value: '10',
        state: 'testing-lighting-10',
      },
      {
        description: 'digit in string',
        value: '1',
        state: 'testing-lighting-10',
      },
      {
        description: 'empty in empty',
        value: '',
        state: '',
      },
      {
        description: 'empty in not-empty',
        value: '',
        state: '12345', // TODO: is this intended
      },
      {
        description: 'string equals string',
        value: 'Title',
        state: 'Title',
      },
      {
        description: 'case sensitive',
        value: 'title',
        state: 'Title',
      },
      {
        description: 'number does contain string',
        value: '10',
        state: 2105,
      },
    ])('$description', ({ value, state }) => {
      expect(
        testConditions([{ field: 'test.path', operator: 'contains', value }], 'all', {
          test: { path: state },
        } as unknown as RuntimeState),
      ).toBe(true);
      expect(
        testConditions([{ field: 'test.path', operator: 'not_contains', value }], 'all', {
          test: { path: state },
        } as unknown as RuntimeState),
      ).toBe(false);
    });
  });

  describe('not_contains', () => {
    test.each([
      {
        description: 'number does not contain substring',
        value: '456',
        state: 12345,
      },
      {
        description: 'substring not in string',
        value: 'sound',
        state: 'testing-lighting-10',
      },
      {
        description: 'string and undefined',
        value: 'sound',
        state: undefined,
      },
      {
        description: 'string and null',
        value: 'sound',
        state: null,
      },
      {
        description: 'boolean true and string true',
        value: 'true',
        state: true,
      },
      {
        description: 'boolean false and string false',
        value: 'false',
        state: false,
      },
    ])('$description', ({ value, state }) => {
      expect(
        testConditions([{ field: 'test.path', operator: 'not_contains', value }], 'all', {
          test: { path: state },
        } as unknown as RuntimeState),
      ).toBe(true);
      expect(
        testConditions([{ field: 'test.path', operator: 'contains', value }], 'all', {
          test: { path: state },
        } as unknown as RuntimeState),
      ).toBe(false);
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
