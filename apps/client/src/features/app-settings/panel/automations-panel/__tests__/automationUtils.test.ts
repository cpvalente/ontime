import { TimerLifeCycle, Trigger } from 'ontime-types';

import { checkDuplicates, cycles, groupTriggersByAutomation, operators } from '../automationUtils';

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

describe('groupTriggersByAutomation', () => {
  it('returns an empty object when there are no triggers', () => {
    expect(groupTriggersByAutomation([])).toEqual({});
  });

  it('collects the lifecycles each automation is bound to', () => {
    const triggers: Trigger[] = [
      { id: '1', title: 'First', trigger: TimerLifeCycle.onStart, automationId: 'a' },
      { id: '2', title: 'Second', trigger: TimerLifeCycle.onFinish, automationId: 'a' },
      { id: '3', title: 'Third', trigger: TimerLifeCycle.onLoad, automationId: 'b' },
    ];

    expect(groupTriggersByAutomation(triggers)).toEqual({
      a: [TimerLifeCycle.onStart, TimerLifeCycle.onFinish],
      b: [TimerLifeCycle.onLoad],
    });
  });

  it('collapses duplicates, the runtime only fires an automation once per lifecycle', () => {
    const triggers: Trigger[] = [
      { id: '1', title: 'First', trigger: TimerLifeCycle.onStart, automationId: 'a' },
      { id: '2', title: 'Second', trigger: TimerLifeCycle.onStart, automationId: 'a' },
    ];

    expect(groupTriggersByAutomation(triggers)).toEqual({ a: [TimerLifeCycle.onStart] });
  });
});

describe('operators', () => {
  it('does not offer not_contains, which the server validation rejects', () => {
    expect(operators.map(({ value }) => value)).not.toContain('not_contains');
  });
});

describe('cycles', () => {
  it('uses the shared user facing labels', () => {
    expect(cycles.find(({ value }) => value === 'onStart')?.label).toBe('On Start');
  });
});
