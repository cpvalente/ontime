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

/**
 * Summarises an automation's outputs by kind so that a list row can say what the
 * automation does without the user having to open the form.
 * Shared between the automation settings panel and the rundown event editor.
 */
export function summariseOutputs(outputs: AutomationOutput[]): OutputSummary[] {
  const counts = new Map<AutomationOutput['type'], number>();

  for (const output of outputs) {
    counts.set(output.type, (counts.get(output.type) ?? 0) + 1);
  }

  // keep a stable presentation order regardless of the order the user added outputs
  const order: AutomationOutput['type'][] = ['osc', 'http', 'ontime'];
  return order
    .filter((type) => counts.has(type))
    .map((type) => ({ type, label: outputLabels[type], count: counts.get(type) as number }));
}
