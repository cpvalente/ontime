import { DatabaseModel, Rundown } from 'ontime-types';
import { ONTIME_VERSION } from '../ONTIME_VERSION.js';
import { generateId } from 'ontime-utils';

const defaultRundown: Rundown = {
  id: 'default',
  title: 'Default',
  order: [],
  flatOrder: [],
  entries: {},
  revision: 0,
};

const dbModel: DatabaseModel = {
  rundowns: {
    default: { ...defaultRundown },
  },
  project: {
    title: '',
    description: '',
    url: '',
    info: '',
    logo: null,
    custom: [],
  },
  settings: {
    version: ONTIME_VERSION,
    editorKey: null,
    operatorKey: null,
    timeFormat: '24',
    language: 'en',
  },
  viewSettings: {
    overrideStyles: false,
    normalColor: '#ffffffcc',
    warningColor: '#ffa528',
    dangerColor: '#ff7300',
  },
  urlPresets: [],
  customFields: {},
  automation: {
    enabledAutomations: true,
    enabledOscIn: false,
    oscPortIn: 8888,
    triggers: [],
    automations: {},
  },
};

/**
 * Creates a new project with a single rundown of given Id
 */
export function makeNewProject(defaultRundownId?: string): DatabaseModel {
  const rundown = makeNewRundown(defaultRundownId);
  const newProject = structuredClone(dbModel);
  newProject.rundowns = {
    [rundown.id]: rundown,
  };

  return newProject;
}

/**
 * Creates a new rundown with given Id
 */
export function makeNewRundown(id?: string): Rundown {
  const rundownId = id || generateId();
  const newRundown = structuredClone(defaultRundown);
  newRundown.id = rundownId;
  return newRundown;
}

/**
 * Get a top level property of the DatabaseModel
 */
export function getPartialProject<T extends keyof DatabaseModel>(key: T): DatabaseModel[T] {
  if (Object.hasOwn(dbModel, key)) {
    return structuredClone(dbModel[key]);
  }
  throw new Error(`Key ${key} does not exist on DatabaseModel`);
}
