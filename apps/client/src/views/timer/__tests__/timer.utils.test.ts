import { MessageState, OntimeEvent, Playback, TimerPhase, TimerType } from 'ontime-types';
import { createEvent, createGroup } from 'ontime-utils';

import {
  getCardData,
  getEstimatedFontSize,
  getSecondaryDisplay,
  getShowMessage,
  getShowModifiers,
  getTotalTime,
  shouldPlayEndSound,
} from '../timer.utils';

describe('shouldPlayEndSound()', () => {
  test.each([TimerPhase.Default, TimerPhase.Warning, TimerPhase.Danger])(
    'sounds when a running timer goes into overtime from %s',
    (previousPhase) => {
      expect(shouldPlayEndSound(previousPhase, TimerPhase.Overtime)).toBe(true);
    },
  );

  it('stays silent on the first phase we see, a client could be joining mid-overtime', () => {
    expect(shouldPlayEndSound(null, TimerPhase.Overtime)).toBe(false);
  });

  it('stays silent when the phase was reset, a reload during overtime starts from none', () => {
    expect(shouldPlayEndSound(TimerPhase.None, TimerPhase.Overtime)).toBe(false);
  });

  it('stays silent for a roll timer waiting to start', () => {
    expect(shouldPlayEndSound(TimerPhase.Pending, TimerPhase.Overtime)).toBe(false);
  });

  it('sounds once, not on every update while in overtime', () => {
    expect(shouldPlayEndSound(TimerPhase.Overtime, TimerPhase.Overtime)).toBe(false);
  });

  it('stays silent on phases which are not the end of the timer', () => {
    expect(shouldPlayEndSound(TimerPhase.Default, TimerPhase.Warning)).toBe(false);
    expect(shouldPlayEndSound(TimerPhase.Warning, TimerPhase.Danger)).toBe(false);
    expect(shouldPlayEndSound(TimerPhase.Overtime, TimerPhase.None)).toBe(false);
  });
});

describe('getShowMessage()', () => {
  const message = { text: 'Wrap up', visible: true, blink: false, blackout: false, secondarySource: null };

  it('shows a message which has text and is set visible', () => {
    expect(getShowMessage(message)).toBe(true);
  });

  it('hides a message which is not visible or has no text', () => {
    expect(getShowMessage({ ...message, visible: false })).toBe(false);
    expect(getShowMessage({ ...message, text: '' })).toBe(false);
  });
});

describe('getTotalTime()', () => {
  it('adds the time added by the operator to the planned duration', () => {
    expect(getTotalTime(60000, 5000)).toBe(65000);
    expect(getTotalTime(60000, -10000)).toBe(50000);
  });

  it('treats missing values as zero', () => {
    expect(getTotalTime(null, null)).toBe(0);
    expect(getTotalTime(60000, null)).toBe(60000);
  });
});

describe('getEstimatedFontSize()', () => {
  it('uses a smaller font for longer timers so they fit in the screen', () => {
    expect(getEstimatedFontSize('00:01:00')).toBeLessThan(getEstimatedFontSize('1:00'));
  });

  it('shrinks the timer to leave room for secondary content', () => {
    expect(getEstimatedFontSize('1:00', 'next up')).toBeLessThan(getEstimatedFontSize('1:00'));
  });
});

describe('getShowModifiers()', () => {
  const noModifiers = { showEndMessage: false, showFinished: false, showWarning: false, showDanger: false };

  it('flags the phase the timer is in when it counts down', () => {
    const args = [TimerType.CountDown, false] as const;
    expect(getShowModifiers(...args, TimerPhase.Warning, false, '', false)).toStrictEqual({
      ...noModifiers,
      showWarning: true,
    });
    expect(getShowModifiers(...args, TimerPhase.Danger, false, '', false)).toStrictEqual({
      ...noModifiers,
      showDanger: true,
    });
    expect(getShowModifiers(...args, TimerPhase.Overtime, false, '', false)).toStrictEqual({
      ...noModifiers,
      showFinished: true,
    });
    expect(getShowModifiers(...args, TimerPhase.Default, false, '', false)).toStrictEqual(noModifiers);
  });

  it('shows the end message only if overtime is frozen and a message is set', () => {
    const args = [TimerType.CountDown, false, TimerPhase.Overtime] as const;
    expect(getShowModifiers(...args, true, 'Time is up', false).showEndMessage).toBe(true);
    expect(getShowModifiers(...args, true, '', false).showEndMessage).toBe(false);
    expect(getShowModifiers(...args, false, 'Time is up', false).showEndMessage).toBe(false);
  });

  it('does not flag phases for timers where they have no meaning, unless counting to end', () => {
    expect(getShowModifiers(TimerType.CountUp, false, TimerPhase.Danger, false, '', false)).toStrictEqual(noModifiers);
    expect(getShowModifiers(TimerType.Clock, false, TimerPhase.Warning, false, '', false)).toStrictEqual(noModifiers);
    expect(getShowModifiers(TimerType.CountUp, true, TimerPhase.Danger, false, '', false).showDanger).toBe(true);
  });

  it('hides every modifier when the view is set to hide the phase', () => {
    expect(getShowModifiers(TimerType.CountDown, false, TimerPhase.Danger, true, 'msg', true)).toStrictEqual(
      noModifiers,
    );
  });
});

describe('getSecondaryDisplay()', () => {
  const message = (secondarySource: MessageState['timer']['secondarySource'], secondary = ''): MessageState => ({
    timer: { text: '', visible: false, blink: false, blackout: false, secondarySource },
    secondary,
  });
  const display = (state: MessageState, hideSecondary = false) =>
    getSecondaryDisplay(state, 65000, 'min', false, false, hideSecondary);

  it('shows the selected aux timer as a countdown', () => {
    expect(display(message('aux1'))).toBe('00:01:05');
    expect(display(message('aux3'))).toBe('00:01:05');
  });

  it('shows the secondary message when it is the selected source', () => {
    expect(display(message('secondary', 'Camera 2 ready'))).toBe('Camera 2 ready');
  });

  it('shows nothing when there is no source, no message, or the view hides the secondary field', () => {
    expect(display(message(null))).toBeUndefined();
    expect(display(message('secondary', ''))).toBeUndefined();
    expect(display(message('aux1'), true)).toBeUndefined();
  });
});

describe('getCardData()', () => {
  const group = createGroup({ id: 'act-1', title: 'Act 1' });
  const entries = { [group.id]: group };
  const now = { ...createEvent({ title: 'Opening', custom: { speaker: 'Ann' } }, 0), parent: group.id } as OntimeEvent;
  const next = createEvent({ title: 'Keynote', custom: { speaker: 'Bob' } }, 1) as OntimeEvent;
  const card = (playback: Playback, phase: TimerPhase, main = 'title', secondary = 'custom-speaker') =>
    getCardData(now, next, main as keyof OntimeEvent, secondary as keyof OntimeEvent, playback, phase, entries);

  it('shows the running event as now and the following one as next', () => {
    expect(card(Playback.Play, TimerPhase.Default)).toMatchObject({
      showNow: true,
      nowMain: 'Opening',
      nowSecondary: 'Ann',
      showNext: true,
      nextMain: 'Keynote',
      nextSecondary: 'Bob',
    });
  });

  it('shows a loaded event as the upcoming one, with nothing running', () => {
    expect(card(Playback.Armed, TimerPhase.None)).toMatchObject({
      nowMain: undefined,
      nowSecondary: undefined,
      showNext: true,
      nextMain: 'Opening',
      nextSecondary: 'Ann',
    });
  });

  it('treats a roll timer which has not started as not running', () => {
    expect(card(Playback.Roll, TimerPhase.Pending)).toMatchObject({ nowMain: undefined, nextMain: 'Opening' });
  });

  it('shows nothing when playback is stopped', () => {
    expect(card(Playback.Stop, TimerPhase.None)).toMatchObject({ showNow: false, showNext: false });
  });

  it('can show the group title as secondary text', () => {
    expect(card(Playback.Play, TimerPhase.Default, 'title', 'parent').nowSecondary).toBe('Act 1');
  });

  it('hides the cards when the view has no main source', () => {
    expect(card(Playback.Play, TimerPhase.Default, 'none')).toMatchObject({ showNow: false, showNext: false });
  });

  it('hides the next card when there is nothing to show in it', () => {
    const result = getCardData(now, null, 'title', 'none', Playback.Play, TimerPhase.Default, entries);
    expect(result).toMatchObject({ showNow: true, showNext: false });
  });
});
