// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PROJECT_RUNDOWNS } from '../../../../../common/api/constants';
import {
  RundownScopeProvider,
  RundownScopeValue,
  useRundownScope,
} from '../../../../../common/context/RundownScopeContext';
import { setPlayback } from '../../../../../common/hooks/useSocket';
import { useRundownKeyboard } from '../../../../rundown/hooks/useRundownKeyboard';
import TrackingPlaybackBar from '../TrackingPlaybackBar';

// the project rundown list is seeded, a fetch must never settle and overwrite it
vi.mock('../../../../../common/api/rundown', () => ({
  fetchProjectRundownList: vi.fn<() => Promise<never>>(() => new Promise(() => {})),
}));

vi.mock('../../../../../common/hooks/useSocket', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../../../../common/hooks/useSocket')>();
  const { Playback } = await import('ontime-types');
  return {
    ...original,
    usePlaybackControl: () => ({ playback: Playback.Play, numEvents: 3, selectedEventIndex: 1 }),
    setPlayback: { ...original.setPlayback, startNext: vi.fn(), stop: vi.fn() },
  };
});

let scope: RundownScopeValue | undefined;

/** registers the rundown shortcuts ahead of the bar, so the rundown clears the selection first */
function RundownShortcuts() {
  scope = useRundownScope();
  const { selectionStore } = scope;
  useRundownKeyboard({
    cursor: null,
    commands: {} as Parameters<typeof useRundownKeyboard>[0]['commands'],
    clearSelectedEvents: () => selectionStore.getState().clearSelectedEvents(),
    setEntryCopyId: () => {},
    jumpToCurrent: () => {},
  });
  return null;
}

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
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    queryClient.setQueryData(PROJECT_RUNDOWNS, { loaded: 'loaded', rundowns: [] });
    root = createRoot(document.createElement('div'));
    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <RundownScopeProvider rundownId={null}>
            <RundownShortcuts />
            <TrackingPlaybackBar />
          </RundownScopeProvider>
        </QueryClientProvider>,
      );
    });
  });

  afterEach(async () => {
    await act(async () => root?.unmount());
    root = undefined;
    scope = undefined;
    vi.unstubAllGlobals();
  });

  it('clears a rundown selection on Escape without stopping playback', () => {
    act(() => scope!.selectionStore.getState().setSingleEntrySelection({ id: 'event-1' }));

    press('Escape', 'Escape');

    expect(scope!.selectionStore.getState().selectedEvents).toEqual(new Set());
    expect(setPlayback.stop).not.toHaveBeenCalled();
  });

  it('stops playback on Escape without a rundown selection', () => {
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
