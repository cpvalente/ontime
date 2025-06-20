import { TriggerDTO, TimerLifeCycle, AutomationDTO, Automation } from 'ontime-types';

import {
  addTrigger,
  addAutomation,
  deleteAll,
  deleteAllTriggers,
  deleteTrigger,
  deleteAutomation,
  editTrigger,
  editAutomation,
  getAutomationTriggers,
  getAutomations,
} from '../automation.dao.js';
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

describe('addTrigger()', () => {
  beforeEach(async () => {
    await deleteAllTriggers();
  });

  it('should accept a valid trigger', async () => {
    const testData: TriggerDTO = {
      title: 'test',
      trigger: TimerLifeCycle.onLoad,
      automationId: 'test-automation-id',
    };

    const trigger = await addTrigger(testData);
    expect(trigger).toMatchObject(testData);
  });
});

describe('editTrigger()', () => {
  beforeEach(async () => {
    await deleteAllTriggers();
    await addTrigger({
      title: 'test-osc',
      trigger: TimerLifeCycle.onLoad,
      automationId: 'test-osc-automation',
    });
    await addTrigger({
      title: 'test-http',
      trigger: TimerLifeCycle.onFinish,
      automationId: 'test-http-automation',
    });
  });

  it('should edit the contents of a trigger', async () => {
    const triggers = getAutomationTriggers();
    const fistTrigger = triggers[0];
    expect(fistTrigger).toMatchObject({ id: expect.any(String), title: 'test-osc' });

    const editedOSC = await editTrigger(fistTrigger.id, {
      title: 'edited-title',
      trigger: TimerLifeCycle.onDanger,
      automationId: 'test-osc-automation',
    });

    expect(editedOSC).toMatchObject({
      id: expect.any(String),
      title: 'edited-title',
      trigger: TimerLifeCycle.onDanger,
      automationId: 'test-osc-automation',
    });
  });
});

describe('deleteTrigger()', () => {
  beforeEach(async () => {
    await deleteAllTriggers();
    await addTrigger({
      title: 'test-osc',
      trigger: TimerLifeCycle.onLoad,
      automationId: 'test-osc-automation',
    });
    addTrigger({
      title: 'test-http',
      trigger: TimerLifeCycle.onFinish,
      automationId: 'test-http-automation',
    });
  });

  it('should remove an automation from the list', async () => {
    const triggers = getAutomationTriggers();
    expect(triggers.length).toEqual(2);
    const fistTrigger = triggers[0];
    expect(fistTrigger).toMatchObject({ id: expect.any(String), title: 'test-osc' });

    await deleteTrigger(fistTrigger.id);
    const removed = getAutomationTriggers();
    expect(removed.length).toEqual(1);
    expect(removed[0].title).not.toEqual('test-osc');
  });
});

describe('addAutomation()', () => {
  beforeEach(async () => {
    await deleteAll();
  });

  it('should accept a valid automation', async () => {
    const testData: AutomationDTO = {
      title: 'test',
      filterRule: 'all',
      filters: [],
      outputs: [makeOSCAction(), makeHTTPAction()],
    };

    const automation = await addAutomation(testData);
    const automations = getAutomations();
    expect(automations[automation.id]).toMatchObject(testData);
  });
});

describe('editAutomation()', async () => {
  // saving the ID of the added automation
  let firstAutomation: Automation;
  beforeEach(async () => {
    await deleteAll();
    firstAutomation = await addAutomation({
      title: 'test-osc',
      filterRule: 'all',
      filters: [],
      outputs: [],
    });
    await addAutomation({
      title: 'test-http',
      filterRule: 'all',
      filters: [],
      outputs: [],
    });
  });

  it('should edit the contents of an automation', async () => {
    const automations = getAutomations();
    expect(Object.keys(automations).length).toEqual(2);
    expect(automations[firstAutomation.id]).toMatchObject({
      id: firstAutomation.id,
      title: 'test-osc',
      filterRule: 'all',
      filters: expect.any(Array),
      outputs: expect.any(Array),
    });

    const editedOSC = await editAutomation(firstAutomation.id, {
      title: 'edited-title',
      filterRule: 'any',
      filters: [],
      outputs: [],
    });

    expect(editedOSC).toMatchObject({
      id: firstAutomation.id,
      title: 'edited-title',
      filterRule: 'any',
      filters: expect.any(Array),
      outputs: expect.any(Array),
    });
  });
});

describe('deleteAutomation()', () => {
  // saving the ID of the added automation
  let firstAutomation: Automation;
  beforeEach(async () => {
    await deleteAll();
    firstAutomation = await addAutomation({
      title: 'test-osc',
      filterRule: 'all',
      filters: [],
      outputs: [],
    });
  });

  it('should remove m automation from the list', async () => {
    const automations = getAutomations();
    expect(Object.keys(automations).length).toEqual(1);

    await deleteAutomation(Object.keys(automations)[0]);
    const removed = getAutomations();
    expect(Object.keys(removed).length).toEqual(0);
  });

  it('should not remove an automation which is in use', async () => {
    const automations = getAutomations();
    await addTrigger({
      title: 'test-automation',
      trigger: TimerLifeCycle.onLoad,
      automationId: firstAutomation.id,
    });

    const automationKeys = Object.keys(automations);
    const automationId = automationKeys[0];
    expect(automationId).toEqual(firstAutomation.id);
    expect(automationKeys.length).toEqual(1);
    expect(automations[automationId]).toMatchObject({
      id: automationId,
      title: 'test-osc',
      filterRule: 'all',
      filters: expect.any(Array),
      outputs: expect.any(Array),
    });

    await expect(deleteAutomation(automationId)).rejects.toThrowError();
  });
});
