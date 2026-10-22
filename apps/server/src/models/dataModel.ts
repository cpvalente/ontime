import { randomUUID } from 'node:crypto';

import { DatabaseModel, Rundown } from 'ontime-types';
import { generateId } from 'ontime-utils';

import { ONTIME_VERSION } from '../ONTIME_VERSION.js';

const defaultRundown: Rundown = {
  id: 'default',
  title: 'Default',
  order: [],
  flatOrder: [],
  entries: {},
  revision: 0,
};

/** each project gets its own id when it is made */
const dbModel: Omit<DatabaseModel, 'projectId'> = {
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
    auxTimerNames: ['', '', ''],
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
  return {
    ...structuredClone(dbModel),
    projectId: makeProjectId(),
    rundowns: {
      [rundown.id]: rundown,
    },
  };
}

export function makeProjectId(): string {
  return randomUUID();
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
export function getPartialProject<T extends keyof typeof dbModel>(key: T): (typeof dbModel)[T] {
  if (Object.hasOwn(dbModel, key)) {
    return structuredClone(dbModel[key]);
  }
  throw new Error(`Key ${key} does not exist on DatabaseModel`);
}
