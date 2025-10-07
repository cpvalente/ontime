import type { SecondarySource } from '../runtime/MessageControl.type.js';
import type { TimerLifeCycle } from './TimerLifecycle.type.js';

export type AutomationSettings = {
  enabledAutomations: boolean;
  enabledOscIn: boolean;
  oscPortIn: number;
  triggers: Trigger[];
  automations: NormalisedAutomation;
};

type AutomationId = string;
export type FilterRule = 'all' | 'any';

export type Automation = {
  id: AutomationId;
  title: string;
  filterRule: FilterRule;
  filters: AutomationFilter[];
  outputs: AutomationOutput[];
};

export type AutomationDTO = Omit<Automation, 'id'>;

export type NormalisedAutomation = Record<AutomationId, Automation>;

export type Trigger = {
  id: string;
  title: string;
  trigger: TimerLifeCycle;
  automationId: AutomationId;
};

export type TriggerDTO = Omit<Trigger, 'id'>;

export type AutomationFilter = {
  field: string; // this should be a key of a OntimeEvent + custom fields
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: string; // we use string but would coerce to the field value
};

export type AutomationOutput = OSCOutput | HTTPOutput | OntimeAction;

export type OSCOutput = {
  type: 'osc';
  targetIP: string;
  targetPort: number;
  address: string;
  args: string;
};

export type HTTPOutput = {
  type: 'http';
  url: string;
};

const ontimeAuxTriggerAction = [
  'aux1-start',
  'aux1-stop',
  'aux1-pause',
  'aux2-start',
  'aux2-stop',
  'aux2-pause',
  'aux3-start',
  'aux3-stop',
  'aux3-pause',
] as const;

const ontimeAuxSetAction = ['aux1-set', 'aux2-set', 'aux3-set'] as const;

type OntimeAuxTriggerAction = (typeof ontimeAuxTriggerAction)[number];
type OntimeAuxSetAction = (typeof ontimeAuxSetAction)[number];
type OntimeMessageSet = 'message-set';
type OntimeMessageSecondary = 'message-secondary';

export type OntimeActionKey = OntimeAuxTriggerAction | OntimeAuxSetAction | OntimeMessageSet | OntimeMessageSecondary;

export const ontimeActionKeyValues = [
  ...ontimeAuxTriggerAction,
  ...ontimeAuxSetAction,
  'message-set',
  'message-secondary',
];

export type OntimeAction =
  | {
      type: 'ontime';
      action: OntimeAuxTriggerAction;
    }
  | {
      type: 'ontime';
      action: OntimeAuxSetAction;
      time: string;  //TODO:(automation set aux) not sure what way around to have the string and where to have the ms value
    }
  | {
      type: 'ontime';
      action: OntimeMessageSet;
      text?: string;
      visible?: boolean;
    }
  | {
      type: 'ontime';
      action: OntimeMessageSecondary;
      secondarySource: SecondarySource;
    };
