import { TimerLifeCycle, Trigger } from 'ontime-types';

import { checkDuplicates } from '../automationUtils';

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
