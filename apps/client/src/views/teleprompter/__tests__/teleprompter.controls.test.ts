import type { TeleprompterController } from '../teleprompter.types';
import { applyTeleprompterAction } from '../useTeleprompterControls';

function makeController() {
  const state = {
    isRunning: false,
    position: 10,
    speed: 14,
  };

  const controller: TeleprompterController = {
    play: () => {
      state.isRunning = true;
    },
    pause: () => {
      state.isRunning = false;
    },
    togglePlay: () => {
      state.isRunning = !state.isRunning;
    },
    nudge: (lines) => {
      state.position += lines;
    },
    page: () => undefined,
    jumpEvent: () => undefined,
    setSpeed: (speed) => {
      state.speed = speed;
    },
    changeSpeed: (delta) => {
      state.speed += delta;
    },
    rewind: () => {
      state.position = 0;
    },
    jumpToEnd: () => undefined,
    reengageFollow: () => undefined,
  };

  return { controller, state };
}

const callbacks = {
  onFlip: () => undefined,
  onFontSize: () => undefined,
  onResetFontSize: () => undefined,
  onToggleHelp: () => undefined,
};

describe('applyTeleprompterAction()', () => {
  test('preserves consecutive local playback toggles', () => {
    const { controller, state } = makeController();

    applyTeleprompterAction({ type: 'togglePlay' }, { controller, ...callbacks });
    expect(state.isRunning).toBe(true);

    applyTeleprompterAction({ type: 'togglePlay' }, { controller, ...callbacks });
    expect(state.isRunning).toBe(false);
  });

  test('preserves consecutive local speed changes', () => {
    const { controller, state } = makeController();

    applyTeleprompterAction({ type: 'speed', delta: 5 }, { controller, ...callbacks });
    applyTeleprompterAction({ type: 'speed', delta: 5 }, { controller, ...callbacks });

    expect(state.speed).toBe(24);
  });

  test('rewinds and pauses as two base operations', () => {
    const { controller, state } = makeController();
    state.isRunning = true;

    applyTeleprompterAction({ type: 'rewindAndPause' }, { controller, ...callbacks });

    expect(state.position).toBe(0);
    expect(state.isRunning).toBe(false);
  });
});
