// @vitest-environment happy-dom
import { type Context, act, createContext, createElement, useContext } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import EntryEditModal from '../EntryEditModal';
import { useEditModal } from '../useEditModal';

const TestScope = vi.hoisted(() => ({ context: null as unknown as Context<string> }));

vi.mock('../../../../common/context/RundownScopeContext', () => ({
  useRundownScope: () => ({ rundownId: useContext(TestScope.context) }),
}));
vi.mock('../../../../common/hooks-query/useRundown', () => ({ default: () => ({ data: {} }) }));
vi.mock('../../../../common/components/modal/Modal', () => ({ default: () => createElement('div', { id: 'modal' }) }));
vi.mock('../../../../features/rundown/entry-editor/CuesheetEventEditor', () => ({ default: () => null }));

describe('EntryEditModal', () => {
  let root: Root;
  let container: HTMLDivElement;

  const render = (rundownId: string) =>
    act(() =>
      root.render(createElement(TestScope.context.Provider, { value: rundownId }, createElement(EntryEditModal))),
    );

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    TestScope.context = createContext('');
    container = document.createElement('div');
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    useEditModal.getState().clearSelection();
    vi.unstubAllGlobals();
  });

  it('closes when the scope moves to another rundown, rather than editing it', () => {
    useEditModal.getState().setEditableEntry('entry', 'rundown-a');
    render('rundown-a');
    expect(container.querySelector('#modal')).not.toBeNull();

    render('rundown-b');

    expect(container.querySelector('#modal')).toBeNull();
    expect(useEditModal.getState().selectedEntryId).toBeNull();
  });
});
