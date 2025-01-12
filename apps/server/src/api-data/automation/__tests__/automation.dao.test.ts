import { AutomationBlueprint, AutomationBlueprintDTO, AutomationDTO, TimerLifeCycle } from 'ontime-types';

import {
  addAutomation,
  addBlueprint,
  deleteAll,
  deleteAllAutomations,
  deleteAutomation,
  deleteBlueprint,
  editAutomation,
  editBlueprint,
  getAutomations,
  getBlueprints,
} from '../automation.dao.js';
import { makeOSCAction, makeHTTPAction } from './testUtils.js';

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

describe('addAutomations()', () => {
  beforeEach(() => {
    deleteAllAutomations();
  });

  it('should accept a valid automation', () => {
    const testData: AutomationDTO = {
      title: 'test',
      trigger: TimerLifeCycle.onLoad,
      blueprintId: 'test-blueprint-id',
    };

    const automation = addAutomation(testData);
    expect(automation).toMatchObject(testData);
  });
});

describe('editAutomation()', () => {
  beforeEach(() => {
    deleteAllAutomations();
    addAutomation({
      title: 'test-osc',
      trigger: TimerLifeCycle.onLoad,
      blueprintId: 'test-osc-blueprint',
    });
    addAutomation({
      title: 'test-http',
      trigger: TimerLifeCycle.onFinish,
      blueprintId: 'test-http-blueprint',
    });
  });

  it('should edit the contents of an automation', () => {
    const automations = getAutomations();
    const firstAutomation = automations[0];
    expect(firstAutomation).toMatchObject({ id: expect.any(String), title: 'test-osc' });

    const editedOSC = editAutomation(firstAutomation.id, {
      title: 'edited-title',
      trigger: TimerLifeCycle.onDanger,
      blueprintId: 'test-osc-blueprint',
    });

    expect(editedOSC).toMatchObject({
      id: expect.any(String),
      title: 'edited-title',
      trigger: TimerLifeCycle.onDanger,
      blueprintId: 'test-osc-blueprint',
    });
  });
});

describe('deleteAutomation()', () => {
  beforeEach(() => {
    deleteAllAutomations();
    addAutomation({
      title: 'test-osc',
      trigger: TimerLifeCycle.onLoad,
      blueprintId: 'test-osc-blueprint',
    });
    addAutomation({
      title: 'test-http',
      trigger: TimerLifeCycle.onFinish,
      blueprintId: 'test-http-blueprint',
    });
  });

  it('should remove an automation from the list', () => {
    const automations = getAutomations();
    expect(automations.length).toEqual(2);
    const firstAutomation = automations[0];
    expect(firstAutomation).toMatchObject({ id: expect.any(String), title: 'test-osc' });

    deleteAutomation(firstAutomation.id);
    const removed = getAutomations();
    expect(removed.length).toEqual(1);
    expect(removed[0].title).not.toEqual('test-osc');
  });
});

describe('addBlueprint()', () => {
  beforeEach(() => {
    deleteAll();
  });

  it('should accept a valid blueprint', () => {
    const testData: AutomationBlueprintDTO = {
      title: 'test',
      filterRule: 'all',
      filters: [],
      outputs: [makeOSCAction(), makeHTTPAction()],
    };

    const blueprint = addBlueprint(testData);
    const blueprints = getBlueprints();
    expect(blueprints[blueprint.id]).toMatchObject(testData);
  });
});

describe('editBlueprint()', () => {
  // saving the ID of the added blueprint
  let firstBlueprint: AutomationBlueprint;
  beforeEach(() => {
    deleteAll();
    firstBlueprint = addBlueprint({
      title: 'test-osc',
      filterRule: 'all',
      filters: [],
      outputs: [],
    });
    addBlueprint({
      title: 'test-http',
      filterRule: 'all',
      filters: [],
      outputs: [],
    });
  });

  it('should edit the contents of a blueprint', () => {
    const blueprints = getBlueprints();
    expect(Object.keys(blueprints).length).toEqual(2);
    expect(blueprints[firstBlueprint.id]).toMatchObject({
      id: firstBlueprint.id,
      title: 'test-osc',
      filterRule: 'all',
      filters: expect.any(Array),
      outputs: expect.any(Array),
    });

    const editedOSC = editBlueprint(firstBlueprint.id, {
      title: 'edited-title',
      filterRule: 'any',
      filters: [],
      outputs: [],
    });

    expect(editedOSC).toMatchObject({
      id: firstBlueprint.id,
      title: 'edited-title',
      filterRule: 'any',
      filters: expect.any(Array),
      outputs: expect.any(Array),
    });
  });
});

describe('deleteBlueprint()', () => {
  // saving the ID of the added blueprint
  let firstBlueprint: AutomationBlueprint;
  beforeEach(() => {
    deleteAll();
    firstBlueprint = addBlueprint({
      title: 'test-osc',
      filterRule: 'all',
      filters: [],
      outputs: [],
    });
  });

  it('should remove a blueprint from the list', () => {
    const blueprints = getBlueprints();
    expect(Object.keys(blueprints).length).toEqual(1);

    deleteBlueprint(Object.keys(blueprints)[0]);
    const removed = getBlueprints();
    expect(Object.keys(removed).length).toEqual(0);
  });

  it('should not remove a blueprint which is in use', () => {
    const blueprints = getBlueprints();
    addAutomation({
      title: 'test-automation',
      trigger: TimerLifeCycle.onLoad,
      blueprintId: firstBlueprint.id,
    });

    const blueprintKeys = Object.keys(blueprints);
    const blueprintId = blueprintKeys[0];
    expect(blueprintId).toEqual(firstBlueprint.id);
    expect(blueprintKeys.length).toEqual(1);
    expect(blueprints[blueprintId]).toMatchObject({
      id: blueprintId,
      title: 'test-osc',
      filterRule: 'all',
      filters: expect.any(Array),
      outputs: expect.any(Array),
    });

    expect(() => deleteBlueprint(blueprintId)).toThrowError();
  });
});
