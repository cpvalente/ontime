// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OntimeEntry, OntimeEvent, Rundown, SupportedEntry } from 'ontime-types';
import { act, createElement, useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getRundownQueryKey } from '../../api/constants';
import { putEditEntry, requestApplyDelay } from '../../api/rundown';
import { type EntryActions, useEntryActions } from '../useEntryAction';

vi.mock('../../api/rundown', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/rundown')>()),
  putEditEntry: vi.fn<typeof putEditEntry>(),
  requestApplyDelay: vi.fn<typeof requestApplyDelay>(),
}));

function makeEvent(revision: number, title: string): OntimeEvent {
  return { id: 'event', type: SupportedEntry.Event, revision, title } as OntimeEvent;
}

function makeRundown(event: OntimeEvent, id = 'rundown'): Rundown {
  return {
    id,
    title: id,
    entries: { [event.id]: event },
    order: [event.id],
    flatOrder: [event.id],
    revision: 1,
  } as Rundown;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function flush() {
  await act(async () => Promise.resolve());
}

function EntryActionsReader({
  rundownId = 'rundown',
  onActions,
}: {
  rundownId?: string;
  onActions: (actions: EntryActions) => void;
}) {
  const actions = useEntryActions(rundownId);

  useEffect(() => {
    onActions(actions);
  }, [actions, onActions]);

  return null;
}

describe('useEntryActions()', () => {
  let root: Root | undefined;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  });

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount());
      root = undefined;
    }
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('keeps the newer optimistic edit when responses resolve out of order', async () => {
    const firstResponse = deferred<{ data: OntimeEntry }>();
    const secondResponse = deferred<{ data: OntimeEntry }>();
    vi.mocked(putEditEntry)
      .mockReturnValueOnce(firstResponse.promise as ReturnType<typeof putEditEntry>)
      .mockReturnValueOnce(secondResponse.promise as ReturnType<typeof putEditEntry>);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(getRundownQueryKey('rundown'), makeRundown(makeEvent(1, 'original')));
    const container = document.createElement('div');
    root = createRoot(container);
    let actions: EntryActions | undefined;

    await act(async () => {
      root?.render(
        createElement(
          QueryClientProvider,
          { client: queryClient },
          createElement(EntryActionsReader, { onActions: (value) => (actions = value) }),
        ),
      );
    });

    await act(async () => {
      void actions?.updateEntry({ id: 'event', title: 'first edit' });
      await Promise.resolve();
    });
    await act(async () => {
      void actions?.updateEntry({ id: 'event', title: 'second edit' });
      await Promise.resolve();
    });

    expect(queryClient.getQueryData<Rundown>(getRundownQueryKey('rundown'))?.entries.event).toMatchObject({
      title: 'second edit',
      revision: 3,
    });

    secondResponse.resolve({ data: makeEvent(3, 'second edit') });
    await flush();
    firstResponse.resolve({ data: makeEvent(2, 'first edit') });
    await flush();

    expect(queryClient.getQueryData<Rundown>(getRundownQueryKey('rundown'))?.entries.event).toMatchObject({
      title: 'second edit',
      revision: 3,
    });
  });

  it('does not let a late rundown response undo a newer rundown', async () => {
    const response = deferred<{ data: Rundown }>();
    vi.mocked(requestApplyDelay).mockReturnValueOnce(response.promise as ReturnType<typeof requestApplyDelay>);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(getRundownQueryKey('rundown'), makeRundown(makeEvent(1, 'original')));
    root = createRoot(document.createElement('div'));
    let actions: EntryActions | undefined;

    await act(async () => {
      root?.render(
        createElement(
          QueryClientProvider,
          { client: queryClient },
          createElement(EntryActionsReader, { onActions: (value) => (actions = value) }),
        ),
      );
    });

    await act(async () => {
      void actions?.applyDelay('delay');
      await Promise.resolve();
    });

    // a later change lands first
    queryClient.setQueryData(getRundownQueryKey('rundown'), { ...makeRundown(makeEvent(4, 'newer')), revision: 5 });
    response.resolve({ data: { ...makeRundown(makeEvent(2, 'older')), revision: 3 } });
    await flush();

    expect(queryClient.getQueryData<Rundown>(getRundownQueryKey('rundown'))).toMatchObject({
      revision: 5,
      entries: { event: { title: 'newer' } },
    });
  });

  it('writes a delayed mutation response to the rundown that initiated it', async () => {
    const response = deferred<{ data: Rundown }>();
    vi.mocked(requestApplyDelay).mockReturnValueOnce(response.promise as ReturnType<typeof requestApplyDelay>);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(getRundownQueryKey('rundown-a'), makeRundown(makeEvent(1, 'A'), 'rundown-a'));
    queryClient.setQueryData(getRundownQueryKey('rundown-b'), makeRundown(makeEvent(1, 'B'), 'rundown-b'));
    const container = document.createElement('div');
    root = createRoot(container);
    let actions: EntryActions | undefined;
    const onActions = (value: EntryActions) => (actions = value);

    await act(async () => {
      root?.render(
        createElement(
          QueryClientProvider,
          { client: queryClient },
          createElement(EntryActionsReader, { rundownId: 'rundown-a', onActions }),
        ),
      );
    });

    await act(async () => {
      void actions?.applyDelay('delay');
      await Promise.resolve();
      root?.render(
        createElement(
          QueryClientProvider,
          { client: queryClient },
          createElement(EntryActionsReader, { rundownId: 'rundown-b', onActions }),
        ),
      );
    });

    response.resolve({ data: makeRundown(makeEvent(2, 'A updated'), 'rundown-a') });
    await flush();

    expect(queryClient.getQueryData<Rundown>(getRundownQueryKey('rundown-a'))?.entries.event).toMatchObject({
      title: 'A updated',
      revision: 2,
    });
    expect(queryClient.getQueryData<Rundown>(getRundownQueryKey('rundown-b'))?.entries.event).toMatchObject({
      title: 'B',
      revision: 1,
    });
  });
});
