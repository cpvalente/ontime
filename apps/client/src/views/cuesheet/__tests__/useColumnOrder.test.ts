// @vitest-environment happy-dom
import { act, createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeStageKey } from '../../../common/utils/localStorage';
import type { CuesheetColumnDef } from '../cuesheet-table/cuesheetTable.features';
import { useColumnOrder } from '../cuesheet-table/useColumnManager';

describe('useColumnOrder', () => {
  let root: Root;
  let state: ReturnType<typeof useColumnOrder>;

  function Reader({ columns }: { columns: CuesheetColumnDef[] }) {
    state = useColumnOrder(columns);
    return null;
  }

  function render(ids: string[]) {
    return act(async () => {
      root.render(createElement(Reader, { columns: ids.map((id) => ({ id })) }));
    });
  }

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    localStorage.clear();
    root = createRoot(document.createElement('div'));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('follows project order until the user explicitly reorders columns', async () => {
    localStorage.setItem(makeStageKey('cuesheet-table-order'), JSON.stringify(['title', 'Notes', 'Camera']));
    await render(['title', 'Notes', 'Camera']);
    await render(['title', 'Camera', 'Notes']);

    expect(state.columnOrder).toEqual(['title', 'Camera', 'Notes']);
  });

  it('preserves a personal layout across project changes and remounts, until reset', async () => {
    await render(['title', 'Notes', 'Camera']);
    await act(async () => state.saveColumnOrder(['Camera', 'title', 'Notes']));
    await render(['title', 'Camera', 'Notes']);
    expect(state.columnOrder).toEqual(['Camera', 'title', 'Notes']);

    await act(async () => root.unmount());
    root = createRoot(document.createElement('div'));
    await render(['title', 'Camera', 'Notes']);
    expect(state.columnOrder).toEqual(['Camera', 'title', 'Notes']);

    await act(async () => state.resetColumnOrder());
    await render(['title', 'Notes', 'Camera']);
    expect(state.columnOrder).toEqual(['title', 'Notes', 'Camera']);
  });

  it('keeps personal column positions when fields are added or removed', async () => {
    await render(['title', 'Notes', 'Camera']);
    await act(async () => state.saveColumnOrder(['Camera', 'title', 'Notes']));
    await render(['title', 'Camera', 'Lighting']);

    expect(state.columnOrder).toEqual(['Camera', 'title', 'Lighting']);
  });
});
