import { TimerLifeCycle, Trigger } from 'ontime-types';

import { checkDuplicates, operators } from '../automationUtils';

describe('automation form options', () => {
  it('offers the complete filter operator contract', () => {
    expect(operators.map(({ value }) => value)).toEqual([
      'equals',
      'not_equals',
      'contains',
      'not_contains',
      'greater_than',
      'less_than',
    ]);
  });
});

describe('checkDuplicates', () => {
  it('should return undefined if there are no duplicates', () => {
    const triggers: Trigger[] = [
      { id: '1', title: 'First', trigger: TimerLifeCycle.onClock, automationId: '1' },
      { id: '2', title: 'Second', trigger: TimerLifeCycle.onDanger, automationId: '2' },
      { id: '3', title: 'Third', trigger: TimerLifeCycle.onLoad, automationId: '3' },
    ];
    expect(checkDuplicates(triggers)).toBeUndefined();
  });

  it('should return list of titles of duplicates', () => {
    const triggers: Trigger[] = [
      { id: '1', title: 'First', trigger: TimerLifeCycle.onClock, automationId: '1' },
      { id: '2', title: 'Second', trigger: TimerLifeCycle.onDanger, automationId: '2' },
      { id: '3', title: 'Third', trigger: TimerLifeCycle.onClock, automationId: '1' },
      { id: '3', title: 'Third', trigger: TimerLifeCycle.onPause, automationId: '1' },
    ];
    expect(checkDuplicates(triggers)).toStrictEqual([2]);
  });
});
