import { TimerLifeCycle } from 'ontime-types';

import { deleteAllAutomations, addAutomation, addBlueprint } from '../automation.dao.js';
import { triggerAutomations } from '../automation.service.js';

import { makeOSCAction, makeHTTPAction } from './testUtils.js';

import * as oscClient from '../clients/osc.client.js';
import * as httpClient from '../clients/http.client.js';

beforeAll(() => {
  vi.mock('../../../classes/data-provider/DataProvider.js', () => {
    // Create a small mock store
    let automations = {
      enabledAutomations: true,
      enabledOscIn: true,
      oscPortIn: 8888,
      automations: [],
      blueprints: {},
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

    deleteAllAutomations();
    const oscBlueprint = addBlueprint({
      title: 'test-osc',
      filterRule: 'all',
      filters: [],
      outputs: [makeOSCAction()],
    });
    const httpBlueprint = addBlueprint({
      title: 'test-http',
      filterRule: 'any',
      filters: [],
      outputs: [makeHTTPAction()],
    });
    addAutomation({
      title: 'test-osc',
      trigger: TimerLifeCycle.onLoad,
      blueprintId: oscBlueprint.id,
    });
    addAutomation({
      title: 'test-http',
      trigger: TimerLifeCycle.onFinish,
      blueprintId: httpBlueprint.id,
    });
  });

  it('should trigger automations for a given action', () => {
    triggerAutomations(TimerLifeCycle.onLoad, {});
    expect(oscSpy).toHaveBeenCalledTimes(1);
    expect(httpSpy).not.toBeCalled();
    oscSpy.mockReset();
    httpSpy.mockReset();

    triggerAutomations(TimerLifeCycle.onStart, {});
    expect(oscClient.emitOSC).not.toBeCalled();
    expect(httpSpy).not.toBeCalled();
    oscSpy.mockReset();
    httpSpy.mockReset();

    triggerAutomations(TimerLifeCycle.onFinish, {});
    expect(oscSpy).not.toBeCalled();
    expect(httpSpy).toHaveBeenCalledTimes(1);
    oscSpy.mockReset();
    httpSpy.mockReset();

    triggerAutomations(TimerLifeCycle.onStop, {});
    expect(oscSpy).not.toBeCalled();
    expect(httpSpy).not.toBeCalled();
  });
});
