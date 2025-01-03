import type { TimerLifeCycle } from './TimerLifecycle.type.js';

export type AutomationSettings = {
  enabledAutomations: boolean;
  enabledOscIn: boolean;
  oscPortIn: number;
  automations: Automation[];
  blueprints: NormalisedAutomationBlueprint;
};

type BlueprintId = string;
export type FilterRule = 'all' | 'any';

export type AutomationBlueprint = {
  id: BlueprintId;
  title: string;
  filterRule: FilterRule;
  filters: AutomationFilter[];
  outputs: AutomationOutput[];
};

export type AutomationBlueprintDTO = Omit<AutomationBlueprint, 'id'>;

export type NormalisedAutomationBlueprint = Record<BlueprintId, AutomationBlueprint>;

export type Automation = {
  id: string;
  title: string;
  trigger: TimerLifeCycle;
  blueprintId: BlueprintId;
};

export type AutomationDTO = Omit<Automation, 'id'>;

export type AutomationFilter = {
  field: string; // this should be a key of a OntimeEvent + custom fields
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: string; // we use string but would coerce to the field value
};

export type AutomationOutput = OSCOutput | HTTPOutput;

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
