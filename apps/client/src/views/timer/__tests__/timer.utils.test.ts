import { GroupTimerState, Playback, TimerPhase, TimerState, TimerType } from 'ontime-types';

import { getShowsTimerValue, resolveTimerDisplay } from '../timer.utils';

const makeTime = (patch: Partial<TimerState> = {}): TimerState => ({
  addedTime: 0,
  current: 10000,
  duration: 60000,
  elapsed: 50000,
  expectedFinish: null,
  phase: TimerPhase.Default,
  playback: Playback.Play,
  secondaryTimer: null,
  startedAt: null,
  ...patch,
});

const makeGroupTimer = (patch: Partial<GroupTimerState> = {}): GroupTimerState => ({
  current: 100000,
  elapsed: 80000,
  duration: 180000,
  ...patch,
});

const resolve = (time: TimerState, groupTimer: GroupTimerState | null) =>
  resolveTimerDisplay({
    time,
    groupTimer,
    event: { timeWarning: 120000, timeDanger: 60000 },
    timerType: TimerType.CountDown,
    countToEnd: false,
    freezeOvertime: false,
    freezeMessage: '',
    hidePhase: false,
  });

describe('resolveTimerDisplay()', () => {
  it('uses the event timer when there is no group timer', () => {
    const time = makeTime();
    const result = resolve(time, null);

    expect(result.isGroup).toBe(false);
    expect(result.source).toBe(time);
    expect(result.total).toBe(60000);
    expect(result.warning).toBe(120000);
    expect(result.danger).toBe(60000);
  });

  it('adds the time added to an event into the event total', () => {
    expect(resolve(makeTime({ addedTime: 30000 }), null).total).toBe(90000);
  });

  it('uses the group timer when one is present', () => {
    const groupTimer = makeGroupTimer();
    const result = resolve(makeTime(), groupTimer);

    expect(result.isGroup).toBe(true);
    expect(result.source).toBe(groupTimer);
    expect(result.total).toBe(180000);
  });

  it('drops the event thresholds while showing the group', () => {
    const result = resolve(makeTime({ phase: TimerPhase.Danger }), makeGroupTimer());

    expect(result.warning).toBeUndefined();
    expect(result.danger).toBeUndefined();
  });

  it.each([TimerPhase.Warning, TimerPhase.Danger])(
    'reports the group as running while the event is in %s',
    (phase) => {
      const result = resolve(makeTime({ phase }), makeGroupTimer());

      expect(result.phase).toBe(TimerPhase.Default);
      expect(result.showWarning).toBe(false);
      expect(result.showDanger).toBe(false);
      expect(result.showFinished).toBe(false);
    },
  );

  it('reports overtime only once the group itself has run out of time', () => {
    const overrunningEvent = makeTime({ current: -5000, phase: TimerPhase.Overtime });

    // the event is over, but the group still has time left
    const stillRunning = resolve(overrunningEvent, makeGroupTimer({ current: 60000 }));
    expect(stillRunning.phase).toBe(TimerPhase.Default);
    expect(stillRunning.showFinished).toBe(false);

    const overtime = resolve(overrunningEvent, makeGroupTimer({ current: -1000 }));
    expect(overtime.phase).toBe(TimerPhase.Overtime);
    expect(overtime.showFinished).toBe(true);
  });

  it.each([TimerPhase.Pending, TimerPhase.None])('keeps the %s playback phase on the group', (phase) => {
    // these describe the playback state rather than a threshold, so they are true of the group too
    expect(resolve(makeTime({ phase }), makeGroupTimer()).phase).toBe(phase);
  });
});

describe('getShowsTimerValue()', () => {
  it('is true for timer types which render the running timer', () => {
    expect(getShowsTimerValue(TimerType.CountDown)).toBe(true);
    expect(getShowsTimerValue(TimerType.CountUp)).toBe(true);
  });

  it('is false for timer types which do not reflect what is loaded', () => {
    expect(getShowsTimerValue(TimerType.Clock)).toBe(false);
    expect(getShowsTimerValue(TimerType.None)).toBe(false);
  });
});
