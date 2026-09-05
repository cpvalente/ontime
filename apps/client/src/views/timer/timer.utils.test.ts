import { MessageState, SimpleDirection, TimerPhase, TimerType } from 'ontime-types';

import { getSecondaryDisplay, getTimerSlots } from './timer.utils';

function makeMessage(partial: Partial<MessageState['timer']> = {}, secondary = ''): MessageState {
  return {
    timer: {
      text: '',
      visible: false,
      blink: false,
      blackout: false,
      secondarySource: null,
      secondaryPlacement: 'below',
      ...partial,
    },
    secondary,
  };
}

const eventTimer = { content: '00:10:00', timerType: TimerType.CountDown, phase: TimerPhase.Warning };

describe('getTimerSlots()', () => {
  it('keeps the event timer in the main slot when not swapped', () => {
    const { main, secondary } = getTimerSlots(false, eventTimer, 'AUX');

    expect(main).toMatchObject({ content: '00:10:00', phase: TimerPhase.Warning, isEventTimer: true });
    expect(secondary).toMatchObject({ content: 'AUX', phase: undefined, isEventTimer: false });
  });

  it('swaps the secondary into the main slot and demotes the event timer', () => {
    const { main, secondary } = getTimerSlots(true, eventTimer, 'AUX');

    expect(main).toMatchObject({ content: 'AUX', isEventTimer: false, phase: undefined });
    // the event timer is never removed, only demoted, and keeps its phase
    expect(secondary).toMatchObject({ content: '00:10:00', isEventTimer: true, phase: TimerPhase.Warning });
  });

  it('does not swap when there is no secondary content to promote', () => {
    const { main, secondary } = getTimerSlots(true, eventTimer, undefined);

    expect(main.isEventTimer).toBe(true);
    expect(secondary.isEventTimer).toBe(false);
  });
});

describe('getSecondaryDisplay()', () => {
  it('returns nothing when the secondary is hidden', () => {
    const message = makeMessage({ secondarySource: 'aux1' });
    expect(
      getSecondaryDisplay(message, { current: 5000, direction: SimpleDirection.CountDown }, 'min', false, false, true),
    ).toBeUndefined();
  });

  it('returns the secondary message text for the secondary source', () => {
    const message = makeMessage({ secondarySource: 'secondary' }, 'hello');
    expect(getSecondaryDisplay(message, null, 'min', false, false, false)).toBe('hello');
  });

  it('formats an aux source as a timer honouring its direction', () => {
    const message = makeMessage({ secondarySource: 'aux1' });

    // a running count-up aux shows elapsed time without a negative sign
    const countUp = getSecondaryDisplay(
      message,
      { current: 5000, direction: SimpleDirection.CountUp },
      'min',
      false,
      false,
      false,
    );
    expect(countUp).toBe('00:00:05');

    // a count-down aux past zero shows overtime as a negative value
    const countDown = getSecondaryDisplay(
      message,
      { current: -5000, direction: SimpleDirection.CountDown },
      'min',
      false,
      false,
      false,
    );
    expect(countDown).toBe('-00:00:05');
  });

  it('returns nothing when no secondary source is selected', () => {
    const message = makeMessage({ secondarySource: null });
    expect(getSecondaryDisplay(message, null, 'min', false, false, false)).toBeUndefined();
  });
});
