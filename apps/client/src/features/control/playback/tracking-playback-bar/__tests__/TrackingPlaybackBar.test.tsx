// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setPlayback } from '../../../../../common/hooks/useSocket';
import TrackingPlaybackBar from '../TrackingPlaybackBar';

vi.mock('../../../../../common/hooks/useSocket', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../../../../common/hooks/useSocket')>();
  const { Playback } = await import('ontime-types');
  return {
    ...original,
    usePlaybackControl: () => ({ playback: Playback.Play, numEvents: 3, selectedEventIndex: 1 }),
    setPlayback: { ...original.setPlayback, startNext: vi.fn(), stop: vi.fn() },
  };
});

function press(code: string, key: string, repeat = false) {
  act(() => {
    document.body.dispatchEvent(new KeyboardEvent('keydown', { code, key, repeat, bubbles: true }));
  });
}

describe('TrackingPlaybackBar shortcuts', () => {
  let root: Root | undefined;

  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.clearAllMocks();
    root = createRoot(document.createElement('div'));
    await act(async () => {
      root?.render(<TrackingPlaybackBar />);
    });
  });

  afterEach(async () => {
    await act(async () => root?.unmount());
    root = undefined;
    vi.unstubAllGlobals();
  });

  it('stops playback on Escape', () => {
    press('Escape', 'Escape');

    expect(setPlayback.stop).toHaveBeenCalledOnce();
  });

  it('goes once while Space is held', () => {
    press('Space', ' ');
    press('Space', ' ', true);
    press('Space', ' ', true);

    expect(setPlayback.startNext).toHaveBeenCalledOnce();
  });
});
