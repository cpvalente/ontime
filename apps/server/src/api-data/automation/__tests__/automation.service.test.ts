import { TimerLifeCycle } from 'ontime-types';

import {
  clearAutomations,
  Automation,
  addAutomations,
  getAutomations,
  deleteAutomation,
  editAutomation,
  OSCOutput,
  HTTPOutput,
  CompanionOutput,
  triggerAction,
} from '../automation.service.js';

import * as oscClient from '../clients/osc.client.js';
import * as httpClient from '../clients/http.client.js';
import * as companionClient from '../clients/companion.client.js';

// mock event store
vi.mock('../../../stores/EventStore.js', () => ({
  eventStore: {
    poll: vi.fn(),
  },
}));

describe('addAutomations()', () => {
  beforeEach(() => {
    clearAutomations();
  });

  it('should accept a list of valid automations', () => {
    const testData: Automation[] = [
      {
        id: Math.random().toString(),
        title: 'test',
        trigger: TimerLifeCycle.onLoad,
        filterRule: 'all',
        filter: [],
        output: [makeOSCAction(), makeHTTPAction(), makeCompanionAction()],
      },
    ];

    const result = addAutomations(testData);
    expect(result).toMatchObject(testData);
  });
});

describe('removeAutomation()', () => {
  beforeEach(() => {
    clearAutomations();
    addAutomations([
      {
        id: 'test-osc',
        title: 'test-osc',
        trigger: TimerLifeCycle.onLoad,
        filterRule: 'all',
        filter: [],
        output: [],
      },
      {
        id: 'test-http',
        title: 'test-http',
        trigger: TimerLifeCycle.onFinish,
        filterRule: 'all',
        filter: [],
        output: [],
      },
      {
        id: 'test-companion',
        title: 'test-companion',
        trigger: TimerLifeCycle.onStop,
        filterRule: 'all',
        filter: [],
        output: [],
      },
    ]);
  });

  it('should remove an automation from the list', () => {
    const automations = getAutomations();
    expect(automations.length).toEqual(3);
    expect(automations[0].id).toEqual('test-osc');
    expect(automations[0].title).toEqual('test-osc');

    const removed = deleteAutomation('test-osc');
    expect(removed.length).toEqual(2);
    expect(removed[0].id).not.toEqual('test-osc');
    expect(removed[0].title).not.toEqual('test-osc');
  });
});

describe('editAutomation()', () => {
  beforeEach(() => {
    clearAutomations();
    addAutomations([
      {
        id: 'test-osc',
        title: 'test-osc',
        trigger: TimerLifeCycle.onLoad,
        filterRule: 'any',
        filter: [],
        output: [],
      },
      {
        id: 'test-http',
        title: 'test-http',
        trigger: TimerLifeCycle.onFinish,
        filterRule: 'any',
        filter: [],
        output: [],
      },
      {
        id: 'test-companion',
        title: 'test-companion',
        trigger: TimerLifeCycle.onStop,
        filterRule: 'any',
        filter: [],
        output: [],
      },
    ]);
  });

  it('should edit the contents of an automation', () => {
    const automations = getAutomations();
    expect(automations[0].title).toEqual('test-osc');

    const editedOSC = editAutomation('test-osc', {
      id: 'test-osc',
      title: 'edited-title',
      trigger: TimerLifeCycle.onDanger,
      filterRule: 'any',
      filter: [],
      output: [],
    });

    expect(editedOSC[0]).toMatchObject({
      id: 'test-osc',
      title: 'edited-title',
      trigger: TimerLifeCycle.onDanger,
    });
  });
});

describe('triggerAction()', () => {
  beforeEach(() => {
    clearAutomations();
    addAutomations([
      {
        id: 'test-osc',
        title: 'test-osc',
        trigger: TimerLifeCycle.onLoad,
        filterRule: 'any',
        filter: [],
        output: [makeOSCAction()],
      },
      {
        id: 'test-http',
        title: 'test-http',
        trigger: TimerLifeCycle.onFinish,
        filterRule: 'any',
        filter: [],
        output: [makeOSCAction(), makeHTTPAction()],
      },
      {
        id: 'test-companion',
        title: 'test-companion',
        trigger: TimerLifeCycle.onStop,
        filterRule: 'any',
        filter: [],
        output: [makeCompanionAction(), makeCompanionAction()],
      },
    ]);
  });
  it('should trigger automations for a given action', () => {
    const oscSpy = vi.spyOn(oscClient, 'emitOSC');
    const httpSpy = vi.spyOn(httpClient, 'emitHTTP');
    const companionSpy = vi.spyOn(companionClient, 'emitCompanion');

    triggerAction(TimerLifeCycle.onLoad);
    expect(oscSpy).toHaveBeenCalledTimes(1);
    expect(httpSpy).not.toBeCalled();
    expect(companionSpy).not.toBeCalled();
    oscSpy.mockReset();
    httpSpy.mockReset();
    companionSpy.mockReset();

    triggerAction(TimerLifeCycle.onStart);
    expect(oscSpy).not.toBeCalled();
    expect(httpSpy).not.toBeCalled();
    expect(companionSpy).not.toBeCalled();
    oscSpy.mockReset();
    httpSpy.mockReset();
    companionSpy.mockReset();

    triggerAction(TimerLifeCycle.onFinish);
    expect(oscSpy).toHaveBeenCalledTimes(1);
    expect(httpSpy).toHaveBeenCalledTimes(1);
    expect(companionSpy).not.toBeCalled();
    oscSpy.mockReset();
    httpSpy.mockReset();
    companionSpy.mockReset();

    triggerAction(TimerLifeCycle.onStop);
    expect(oscSpy).not.toBeCalled();
    expect(httpSpy).not.toBeCalled();
    expect(companionSpy).toHaveBeenCalledTimes(2);
  });
});

function makeOSCAction(action?: Partial<OSCOutput>): OSCOutput {
  return {
    type: 'osc',
    targetIP: 'localhost',
    targetPort: 3000,
    address: 'test',
    args: 'message',
    ...action,
  };
}

function makeHTTPAction(action?: Partial<HTTPOutput>): HTTPOutput {
  return {
    type: 'http',
    targetIP: 'localhost',
    address: 'test',
    ...action,
  };
}

function makeCompanionAction(action?: Partial<CompanionOutput>): CompanionOutput {
  return {
    type: 'companion',
    targetIP: 'localhost',
    address: 'test',
    page: 1,
    bank: 1,
    ...action,
  };
}
