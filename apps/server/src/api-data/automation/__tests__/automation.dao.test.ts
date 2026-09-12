import { Automation, AutomationDTO, ProjectRundowns, TimerLifeCycle, TriggerDTO } from 'ontime-types';

import { makeOntimeEvent } from '../../rundown/__mocks__/rundown.mocks.js';
import {
  addAutomation,
  addTrigger,
  deleteAll,
  deleteAllTriggers,
  deleteAutomation,
  deleteTrigger,
  editAutomation,
  editTrigger,
  getAutomationTriggers,
  getAutomations,
} from '../automation.dao.js';
import { makeHTTPAction, makeOSCAction } from './testUtils.js';

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

  it('creates an automation and its global triggers together', async () => {
    const automation = await addAutomation({ title: 'triggered', filterRule: 'all', filters: [], outputs: [] }, [
      { title: 'triggered — On Start', trigger: TimerLifeCycle.onStart },
      { title: 'triggered — On Finish', trigger: TimerLifeCycle.onFinish },
    ]);

    expect(getAutomations()[automation.id]).toEqual(automation);
    expect(getAutomationTriggers()).toEqual([
      expect.objectContaining({
        title: 'triggered — On Start',
        trigger: TimerLifeCycle.onStart,
        automationId: automation.id,
      }),
      expect.objectContaining({
        title: 'triggered — On Finish',
        trigger: TimerLifeCycle.onFinish,
        automationId: automation.id,
      }),
    ]);
  });
});

describe('editAutomation()', () => {
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

  it('replaces lifecycle triggers with the automation update', async () => {
    await addTrigger({ title: 'On Start', trigger: TimerLifeCycle.onStart, automationId: firstAutomation.id });
    await addTrigger({ title: 'On Finish', trigger: TimerLifeCycle.onFinish, automationId: firstAutomation.id });

    await editAutomation(firstAutomation.id, { title: 'edited-title', filterRule: 'all', filters: [], outputs: [] }, [
      { title: 'edited-title — On Danger', trigger: TimerLifeCycle.onDanger },
    ]);

    expect(getAutomationTriggers()).toEqual([
      expect.objectContaining({ automationId: firstAutomation.id, trigger: TimerLifeCycle.onDanger }),
    ]);
  });
});

describe('deleteAutomation()', () => {
  beforeEach(async () => {
    await deleteAll();
    await addAutomation({
      title: 'test-osc',
      filterRule: 'all',
      filters: [],
      outputs: [],
    });
  });

  it('should remove an automation from the list', async () => {
    const automations = getAutomations();
    expect(Object.keys(automations).length).toEqual(1);

    const projectRundowns: ProjectRundowns = {
      'rundown-1': {
        id: 'rundown-1',
        title: 'Rundown 1',
        order: ['1'],
        flatOrder: ['1'],
        entries: {
          '1': makeOntimeEvent({
            id: '1',
            triggers: [
              {
                id: 'trigger-1',
                title: 'Trigger 1',
                trigger: TimerLifeCycle.onClock,
                automationId: 'test-automation',
              },
            ],
          }),
        },
        revision: 1,
      },
    };
    await deleteAutomation(projectRundowns, Object.keys(automations)[0]);
    const removed = getAutomations();
    expect(Object.keys(removed).length).toEqual(0);
  });

  it('takes the automation global triggers with it, and leaves the others alone', async () => {
    const doomed = Object.keys(getAutomations())[0];
    const survivor = await addAutomation({ title: 'survivor', filterRule: 'all', filters: [], outputs: [] });

    await addTrigger({ title: 'on start', trigger: TimerLifeCycle.onStart, automationId: doomed });
    await addTrigger({ title: 'on finish', trigger: TimerLifeCycle.onFinish, automationId: doomed });
    await addTrigger({ title: 'keep me', trigger: TimerLifeCycle.onStart, automationId: survivor.id });

    await deleteAutomation({}, doomed);

    // a trigger pointing at nothing never fires, so it must not outlive its automation
    expect(getAutomationTriggers()).toEqual([expect.objectContaining({ title: 'keep me' })]);
    expect(Object.keys(getAutomations())).toEqual([survivor.id]);
  });

  it('refuses an automation attached to an event, and keeps its triggers', async () => {
    const automationId = Object.keys(getAutomations())[0];
    await addTrigger({ title: 'on start', trigger: TimerLifeCycle.onStart, automationId });

    const projectRundowns: ProjectRundowns = {
      'rundown-1': {
        id: 'rundown-1',
        title: 'Rundown 1',
        order: ['1'],
        flatOrder: ['1'],
        entries: {
          '1': makeOntimeEvent({
            id: '1',
            triggers: [{ id: 'trigger-1', title: 'Trigger 1', trigger: TimerLifeCycle.onClock, automationId }],
          }),
        },
        revision: 1,
      },
    };

    await expect(deleteAutomation(projectRundowns, automationId)).rejects.toThrow(/used in rundown/);
    expect(getAutomationTriggers()).toHaveLength(1);
    expect(Object.keys(getAutomations())).toEqual([automationId]);
  });
});
