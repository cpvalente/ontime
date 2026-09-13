import type { AutomationOutput } from 'ontime-types';

const outputLabels: Record<AutomationOutput['type'], string> = {
  osc: 'OSC',
  http: 'HTTP',
  ontime: 'Ontime',
};

export type OutputSummary = {
  type: AutomationOutput['type'];
  label: string;
  count: number;
};

export function summariseOutputs(outputs: AutomationOutput[]): OutputSummary[] {
  const counts = new Map<AutomationOutput['type'], number>();

  for (const output of outputs) {
    counts.set(output.type, (counts.get(output.type) ?? 0) + 1);
  }

  const order: AutomationOutput['type'][] = ['osc', 'http', 'ontime'];
  return order
    .filter((type) => counts.has(type))
    .map((type) => ({ type, label: outputLabels[type], count: counts.get(type) as number }));
}
