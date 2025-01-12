import { Automation, TimerLifeCycle } from 'ontime-types';

import { checkDuplicates } from '../automationUtils';

describe('checkDuplicates', () => {
  it('should return undefined if there are no duplicates', () => {
    const automations: Automation[] = [
      { id: '1', title: 'First', trigger: TimerLifeCycle.onClock, blueprintId: '1' },
      { id: '2', title: 'Second', trigger: TimerLifeCycle.onDanger, blueprintId: '2' },
      { id: '3', title: 'Third', trigger: TimerLifeCycle.onLoad, blueprintId: '3' },
    ];
    expect(checkDuplicates(automations)).toBeUndefined();
  });

  it('should return list of titles of duplicates', () => {
    const automations: Automation[] = [
      { id: '1', title: 'First', trigger: TimerLifeCycle.onClock, blueprintId: '1' },
      { id: '2', title: 'Second', trigger: TimerLifeCycle.onDanger, blueprintId: '2' },
      { id: '3', title: 'Third', trigger: TimerLifeCycle.onClock, blueprintId: '1' },
      { id: '3', title: 'Third', trigger: TimerLifeCycle.onPause, blueprintId: '1' },
    ];
    expect(checkDuplicates(automations)).toStrictEqual([2]);
  });
});
