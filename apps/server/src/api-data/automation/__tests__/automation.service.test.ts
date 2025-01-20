import { PlayableEvent, TimerLifeCycle } from 'ontime-types';

import { makeRuntimeStateData } from '../../../stores/__mocks__/runtimeState.mocks.js';
import { makeOntimeEvent } from '../../../services/rundown-service/__mocks__/rundown.mocks.js';

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

  beforeEach(() => {
    oscSpy = vi.spyOn(oscClient, 'emitOSC').mockImplementation(() => {});
    httpSpy = vi.spyOn(httpClient, 'emitHTTP').mockImplementation(() => {});

    deleteAllTriggers();
    const oscAutomation = addAutomation({
      title: 'test-osc',
      filterRule: 'all',
      filters: [],
      outputs: [makeOSCAction()],
    });
    const httpAutomation = addAutomation({
      title: 'test-http',
      filterRule: 'any',
      filters: [],
      outputs: [makeHTTPAction()],
    });
    addTrigger({
      title: 'test-osc',
      trigger: TimerLifeCycle.onLoad,
      automationId: oscAutomation.id,
    });
    addTrigger({
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

  it('should compare two equal values', () => {
    const mockStore = makeRuntimeStateData({ clock: 10 });
    const result = testConditions([{ field: 'clock', operator: 'equals', value: '10' }], 'all', mockStore);
    expect(result).toBe(true);
  });

  it('should check if a value does not exist', () => {
    const mockStore = makeRuntimeStateData({ eventNow: null });
    const result = testConditions([{ field: 'eventNow.title', operator: 'equals', value: '' }], 'all', mockStore);
    expect(result).toBe(true);
  });

  it('should check if two values are different', () => {
    const mockStore = makeRuntimeStateData({ clock: 10 });
    const result = testConditions([{ field: 'clock', operator: 'not_equals', value: '11' }], 'all', mockStore);
    expect(result).toBe(true);
  });

  it('should check if the given value is smaller', () => {
    const mockStore = makeRuntimeStateData({ clock: 10 });
    const result = testConditions([{ field: 'clock', operator: 'greater_than', value: '9' }], 'all', mockStore);
    expect(result).toBe(true);
  });

  it('should check if the given value is larger', () => {
    const mockStore = makeRuntimeStateData({ clock: 10 });
    const result = testConditions([{ field: 'clock', operator: 'less_than', value: '11' }], 'all', mockStore);
    expect(result).toBe(true);
  });

  it('should check if value contains given string', () => {
    const result = testConditions(
      [{ field: 'eventNow.title', operator: 'contains', value: 'lighting' }],
      'all',
      makeRuntimeStateData({ eventNow: makeOntimeEvent({ title: 'test-lighting' }) as PlayableEvent }),
    );
    expect(result).toBe(true);

    const result2 = testConditions(
      [{ field: 'eventNow.title', operator: 'contains', value: 'sound' }],
      'all',
      makeRuntimeStateData({ eventNow: makeOntimeEvent({ title: 'test-lighting' }) as PlayableEvent }),
    );
    expect(result2).toBe(false);
  });

  it('should check if value does not contain given string', () => {
    const result = testConditions(
      [{ field: 'eventNow.title', operator: 'not_contains', value: 'lighting' }],
      'all',
      makeRuntimeStateData({ eventNow: makeOntimeEvent({ title: 'test-lighting' }) as PlayableEvent }),
    );
    expect(result).toBe(false);

    const result2 = testConditions(
      [{ field: 'eventNow.title', operator: 'not_contains', value: 'sound' }],
      'all',
      makeRuntimeStateData({ eventNow: makeOntimeEvent({ title: 'test-lighting' }) as PlayableEvent }),
    );
    expect(result2).toBe(true);
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
