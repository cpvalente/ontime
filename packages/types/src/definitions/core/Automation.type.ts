import type { SecondarySource } from '../runtime/MessageControl.type.js';
import type { TimerLifeCycle } from './TimerLifecycle.type.js';

export type AutomationSettings = {
  enabledAutomations: boolean;
  enabledOscIn: boolean;
  oscPortIn: number;
  triggers: Trigger[];
  automations: NormalisedAutomation;
};

export type AutomationId = string;
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

export type OntimeAction =
  | {
      type: 'ontime';
      action: 'aux-start' | 'aux-stop' | 'aux-pause';
    }
  | {
      type: 'ontime';
      action: 'aux-set';
      time: number;
    }
  | {
      type: 'ontime';
      action: 'message-set';
      text?: string;
      visible?: boolean;
    }
  | {
      type: 'ontime';
      action: 'message-secondary';
      secondarySource: SecondarySource;
    };
