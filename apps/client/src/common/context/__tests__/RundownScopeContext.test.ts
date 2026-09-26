// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MaybeString, Rundown, SupportedEntry } from 'ontime-types';
import { act, createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PROJECT_RUNDOWNS, getRundownQueryKey } from '../../api/constants';
import { RundownScopeProvider, RundownScopeValue, useRundownScope } from '../RundownScopeContext';

// the project rundown list is seeded, a fetch must never settle and overwrite it
vi.mock('../../api/rundown', () => ({
  fetchProjectRundownList: vi.fn<() => Promise<never>>(() => new Promise(() => {})),
}));

function makeRundown(id: string, eventIds: string[]): Rundown {
  return {
    id,
    title: id,
    order: eventIds,
    flatOrder: eventIds,
    entries: Object.fromEntries(eventIds.map((entryId) => [entryId, { id: entryId, type: SupportedEntry.Event }])),
    revision: 1,
  } as unknown as Rundown;
}

function ScopeReader({ onScope }: { onScope: (scope: RundownScopeValue) => void }) {
  onScope(useRundownScope());
  return null;
}

describe('RundownScopeProvider', () => {
  let root: Root | undefined;
  let queryClient: QueryClient;
  let scope: RundownScopeValue | undefined;

  function render(rundownId: MaybeString) {
    return act(async () => {
      root?.render(
        createElement(
          QueryClientProvider,
          { client: queryClient },
          createElement(
            RundownScopeProvider,
            { rundownId },
            createElement(ScopeReader, { onScope: (value) => (scope = value) }),
          ),
        ),
      );
    });
  }

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    queryClient.setQueryData(PROJECT_RUNDOWNS, { loaded: 'loaded', rundowns: [] });
    queryClient.setQueryData(getRundownQueryKey('loaded'), makeRundown('loaded', ['l1', 'l2']));
    queryClient.setQueryData(getRundownQueryKey('background'), makeRundown('background', ['b1', 'b2', 'b3']));
    root = createRoot(document.createElement('div'));
  });

  afterEach(async () => {
    await act(async () => root?.unmount());
    root = undefined;
    scope = undefined;
    vi.unstubAllGlobals();
  });

  it('follows the loaded rundown when no rundown is given', async () => {
    await render(null);
    expect(scope).toMatchObject({ rundownId: 'loaded', isLoaded: true });
  });

  it('does not treat a scope as loaded before the loaded rundown is known', async () => {
    queryClient.setQueryData(PROJECT_RUNDOWNS, { loaded: '', rundowns: [] });
    await render(null);
    expect(scope).toMatchObject({ rundownId: '', isLoaded: false });
  });

  it('targets a background rundown without claiming its runtime', async () => {
    await render('background');
    expect(scope).toMatchObject({ rundownId: 'background', isLoaded: false });
  });

  it('clears the selection and resolves ranges against the new rundown when the target changes', async () => {
    await render(null);
    const selectionStore = scope!.selectionStore;
    act(() => selectionStore.getState().setSingleEntrySelection({ id: 'l1' }));

    await render('background');
    expect(scope!.selectionStore).toBe(selectionStore);
    expect(selectionStore.getState().selectedEvents).toEqual(new Set());

    act(() => selectionStore.getState().setSelectedEvents({ id: 'b3', index: 2, selectMode: 'shift' }));
    expect(selectionStore.getState().selectedEvents).toEqual(new Set(['b1', 'b2']));
  });
});
