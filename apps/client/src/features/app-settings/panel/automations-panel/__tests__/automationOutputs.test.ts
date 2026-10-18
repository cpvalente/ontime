import type { AutomationOutput } from 'ontime-types';

import { summariseOutputs } from '../automationOutputs';

describe('summariseOutputs', () => {
  it('returns an empty list when there are no outputs', () => {
    expect(summariseOutputs([])).toEqual([]);
  });

  it('counts repeated output kinds', () => {
    const outputs: AutomationOutput[] = [
      { type: 'osc', targetIP: '127.0.0.1', targetPort: 8000, address: '/go', args: '' },
      { type: 'osc', targetIP: '127.0.0.1', targetPort: 8000, address: '/stop', args: '' },
      { type: 'http', url: 'http://127.0.0.1/start' },
    ];

    expect(summariseOutputs(outputs)).toEqual([
      { type: 'osc', label: 'OSC', count: 2 },
      { type: 'http', label: 'HTTP', count: 1 },
    ]);
  });

  it('presents kinds in a stable order regardless of insertion order', () => {
    const outputs: AutomationOutput[] = [
      { type: 'ontime', action: 'aux1-start' },
      { type: 'http', url: 'http://127.0.0.1/start' },
      { type: 'osc', targetIP: '127.0.0.1', targetPort: 8000, address: '/go', args: '' },
    ];

    expect(summariseOutputs(outputs).map(({ type }) => type)).toEqual(['osc', 'http', 'ontime']);
  });
});
