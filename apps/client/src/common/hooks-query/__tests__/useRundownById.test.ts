// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OntimeEntry, Rundown, SupportedEntry } from 'ontime-types';
import { act, createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getRundownQueryKey } from '../../api/constants';
import { fetchCurrentRundown, fetchRundown } from '../../api/rundown';
import { flattenRundown, useRundownById } from '../useRundownById';

vi.mock('../../api/rundown', () => ({
  fetchCurrentRundown: vi.fn<typeof fetchCurrentRundown>(),
  fetchRundown: vi.fn<typeof fetchRundown>(),
}));

const entry = (id: string) => ({ id, type: SupportedEntry.Event, revision: 0 }) as OntimeEntry;

async function waitFor(condition: () => boolean) {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (condition()) return;
    // eslint-disable-next-line no-await-in-loop -- each attempt lets pending updates settle before checking again
    await act(async () => Promise.resolve());
  }
  throw new Error('Timed out waiting for condition');
}

const readRundown = vi.fn<(rundown: Rundown) => void>();

function RundownReader({ rundownId }: { rundownId: string | null }) {
  readRundown(useRundownById(rundownId).data);
  return null;
}

const makeRundown = (id: string, revision = 1) =>
  ({ id, title: id, entries: {}, order: [], flatOrder: [], revision }) as Rundown;

describe('useRundownById', () => {
  let root: Root;
  let queryClient: QueryClient;

  function render(rundownId: string | null) {
    return act(async () => {
      root.render(
        createElement(QueryClientProvider, { client: queryClient }, createElement(RundownReader, { rundownId })),
      );
    });
  }

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    root = createRoot(document.createElement('div'));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('seeds the id-keyed cache while bootstrapping, so the loaded rundown shows as soon as its id is known', async () => {
    const rundown = makeRundown('loaded');
    vi.mocked(fetchCurrentRundown).mockResolvedValue(rundown);
    // the refresh of the id-keyed cache never settles, what we read must come from the seed
    vi.mocked(fetchRundown).mockReturnValue(new Promise(() => {}));

    await render(null);
    await waitFor(() => queryClient.getQueryData(getRundownQueryKey(rundown.id)) === rundown);

    await render(rundown.id);
    expect(readRundown).toHaveBeenLastCalledWith(rundown);
  });

  it('refetches an explicitly selected rundown when its cached data is stale', async () => {
    queryClient.setQueryData(getRundownQueryKey('background'), makeRundown('background', 1));
    vi.mocked(fetchRundown).mockResolvedValue(makeRundown('background', 2));

    await render('background');
    await waitFor(() => queryClient.getQueryData<Rundown>(getRundownQueryKey('background'))?.revision === 2);

    expect(fetchRundown).toHaveBeenCalledWith('background', expect.any(Object));
  });
});

describe('flattenRundown', () => {
  it('resolves the flat order into entries', () => {
    const rundown = { entries: { a: entry('a'), b: entry('b') }, flatOrder: ['a', 'b'] } as unknown as Rundown;
    expect(flattenRundown(rundown).map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('skips ids which have no entry', () => {
    const rundown = { entries: { a: entry('a') }, flatOrder: ['a', 'missing'] } as unknown as Rundown;
    expect(flattenRundown(rundown).map((e) => e.id)).toEqual(['a']);
  });

  it('flattens an optimistic rundown, which carries revision -1', () => {
    const optimistic = { entries: { a: entry('a') }, flatOrder: ['a'], revision: -1 } as unknown as Rundown;
    expect(flattenRundown(optimistic).map((e) => e.id)).toEqual(['a']);
  });
});
