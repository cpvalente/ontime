// @vitest-environment happy-dom
import { Playback } from 'ontime-types';
import { createEvent, createGroup } from 'ontime-utils';
import { act, type ComponentProps, type Ref, useImperativeHandle } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { VirtuosoHandle } from 'react-virtuoso';

import { type RundownScopeValue } from '../../../common/context/RundownScopeContext';
import { createEventSelectionStore } from '../../../common/stores/eventSelectionStore';
import { AppMode } from '../../../ontimeConfig';
import Rundown from '../Rundown';
import { useSelectAndRevealEntry } from '../useSelectAndRevealEntry';

const { scrollToIndex, scrollIntoView, move } = vi.hoisted(() => ({
  scrollToIndex: vi.fn(),
  scrollIntoView: vi.fn(),
  move: vi.fn(),
}));

// Keep the real selection, collapse and scroll flows; replace the virtualizer's DOM measurements.
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    data,
    ref,
    scrollerRef,
  }: {
    data: string[];
    ref: Ref<Pick<VirtuosoHandle, 'scrollToIndex' | 'scrollIntoView'>>;
    scrollerRef: (element: HTMLDivElement | null) => void;
  }) => {
    useImperativeHandle(ref, () => ({ scrollToIndex, scrollIntoView }), []);
    return <div ref={scrollerRef} data-testid='scroller' data-entries={data.join(',')}></div>;
  },
}));
vi.mock('../../../common/context/RundownScopeContext', () => ({ useRundownScope: () => scope }));
vi.mock('../../../common/context/EntryActionsContext', () => ({ useEntryActionsContext: () => ({ move }) }));
vi.mock('../../../common/hooks-query/useAutomationSettings', () => ({
  default: () => ({ data: { enabledAutomations: false }, status: 'success' }),
}));
vi.mock('../useEditorFollowMode', () => ({ useEditorFollowMode: () => ({ editorMode: mode }) }));

let scope: RundownScopeValue;
let mode: AppMode;
let props: ComponentProps<typeof Rundown>;
let root: Root;
let container: HTMLDivElement;

function Harness() {
  const reveal = useSelectAndRevealEntry();
  return (
    <>
      <button onClick={() => reveal({ id: 'inside', index: 1 })}>Reveal</button>
      <Rundown {...props} />
    </>
  );
}

async function render() {
  await act(async () => root.render(<Harness />));
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  sessionStorage.clear();
  vi.clearAllMocks();
  mode = AppMode.Run;
  scope = { rundownId: 'test', isLoaded: true, selectionStore: createEventSelectionStore(() => undefined) };
  props = {
    id: 'test',
    entries: { first: createEvent({ id: 'first' })!, second: createEvent({ id: 'second' })! },
    order: ['first', 'second'],
    flatOrder: ['first', 'second'],
    rundownMetadata: {},
    featureData: { playback: Playback.Stop, selectedEventId: 'first', nextEventId: null },
  };
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

it('suspends following after keyboard scrolling and resumes on the next event', async () => {
  await render();
  scrollToIndex.mockClear();

  container
    .querySelector('[data-testid="scroller"]')!
    .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  props = { ...props, entries: { ...props.entries, first: createEvent({ id: 'first', title: 'Remote edit' })! } };
  await render();
  expect(scrollToIndex).not.toHaveBeenCalled();

  props = { ...props, featureData: { ...props.featureData, selectedEventId: 'second' } };
  await render();
  expect(scrollToIndex).toHaveBeenLastCalledWith(expect.objectContaining({ index: 1 }));
});

it('reveals a finder target after expanding its group', async () => {
  mode = AppMode.Edit;
  window.sessionStorage.setItem('rundown.test-editor-collapsed-groups', JSON.stringify(['group']));
  props = {
    ...props,
    entries: {
      group: createGroup({ id: 'group', entries: ['inside'] }),
      inside: { ...createEvent({ id: 'inside' })!, parent: 'group' },
    },
    order: ['group'],
    flatOrder: ['group', 'inside'],
  };
  await render();
  expect(container.querySelector('[data-testid="scroller"]')!.getAttribute('data-entries')).toBe('group');
  await act(async () => container.querySelector('button')!.click());
  expect(scrollIntoView).toHaveBeenLastCalledWith(expect.objectContaining({ index: 1 }));
  expect(container.querySelector('[data-testid="scroller"]')!.getAttribute('data-entries')).toContain('inside');
});

it('does not scroll when selecting or editing a row in Edit mode', async () => {
  mode = AppMode.Edit;
  await render();

  await act(async () => scope.selectionStore.getState().setSingleEntrySelection({ id: 'second' }));
  props = { ...props, entries: { ...props.entries, second: createEvent({ id: 'second', title: 'Edit' })! } };
  await render();
  expect(scrollIntoView).not.toHaveBeenCalled();
  expect(scrollToIndex).not.toHaveBeenCalled();
});

it('reveals the latest cursor when entering Edit mode', async () => {
  await render();
  await act(async () => scope.selectionStore.getState().setSingleEntrySelection({ id: 'second' }));
  scrollIntoView.mockClear();

  mode = AppMode.Edit;
  await render();
  expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ index: 1 }));
});

it.each(['up', 'down'] as const)(
  'reveals the new index when a move %s and its order update are batched',
  async (direction) => {
    mode = AppMode.Edit;
    const cursor = direction === 'down' ? 'first' : 'second';
    scope.selectionStore.getState().setSingleEntrySelection({ id: cursor });
    let completeMove!: () => void;
    move.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          completeMove = resolve;
        }),
    );
    await render();
    scrollIntoView.mockClear();

    const key = direction === 'down' ? 'ArrowDown' : 'ArrowUp';
    await act(async () => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key, code: key, altKey: true, ctrlKey: true, bubbles: true }),
      );
    });
    expect(move).toHaveBeenCalledWith(cursor, direction);
    expect(scrollIntoView).not.toHaveBeenCalled();

    props = { ...props, order: ['second', 'first'], flatOrder: ['second', 'first'] };
    await act(async () => {
      root.render(<Harness />);
      completeMove();
    });
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenLastCalledWith(expect.objectContaining({ index: direction === 'down' ? 1 : 0 }));
  },
);

it.each([false, true])(
  'handles a live event moving into a collapsed group with following paused: %s',
  async (paused) => {
    sessionStorage.setItem('rundown.test-editor-collapsed-groups', JSON.stringify(['group']));
    props = {
      ...props,
      entries: { ...props.entries, group: createGroup({ id: 'group', entries: [] }) },
      order: ['first', 'group', 'second'],
      flatOrder: ['first', 'group', 'second'],
    };
    await render();
    if (paused) {
      container.querySelector('[data-testid="scroller"]')!.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
    }
    scrollToIndex.mockClear();
    props = {
      ...props,
      entries: {
        ...props.entries,
        first: { ...createEvent({ id: 'first' })!, parent: 'group' },
        group: createGroup({ id: 'group', entries: ['first'] }),
      },
      order: ['group', 'second'],
      flatOrder: ['group', 'first', 'second'],
    };
    await render();
    const visible = container.querySelector('[data-testid="scroller"]')!.getAttribute('data-entries')!.split(',');
    expect(visible.includes('first')).toBe(!paused);
    expect(scrollToIndex.mock.lastCall?.[0].index).toBe(paused ? undefined : 1);
  },
);

it('preserves newer navigation when a pending keyboard move completes', async () => {
  mode = AppMode.Edit;
  scope.selectionStore.getState().setSingleEntrySelection({ id: 'first' });
  let completeMove!: () => void;
  move.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        completeMove = resolve;
      }),
  );
  await render();
  await act(async () => {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        code: 'ArrowDown',
        altKey: true,
        ctrlKey: true,
        bubbles: true,
      }),
    );
  });
  await act(async () => {
    scope.selectionStore.getState().setSelectedEvents({ id: 'second', index: 1, selectMode: 'click' });
    scope.selectionStore.getState().scrollToEntry('second');
  });
  scrollIntoView.mockClear();
  await act(async () => completeMove());
  expect(scrollIntoView).not.toHaveBeenCalled();
});

it('expands a collapsed group when the live entry arrives after its runtime selection', async () => {
  sessionStorage.setItem('rundown.test-editor-collapsed-groups', JSON.stringify(['group']));
  props = {
    ...props,
    entries: { ...props.entries, group: createGroup({ id: 'group', entries: [] }) },
    order: ['first', 'group', 'second'],
    flatOrder: ['first', 'group', 'second'],
  };
  await render();
  props = { ...props, featureData: { ...props.featureData, selectedEventId: 'inside' } };
  await render();
  scrollToIndex.mockClear();
  props = {
    ...props,
    entries: {
      ...props.entries,
      group: createGroup({ id: 'group', entries: ['inside'] }),
      inside: { ...createEvent({ id: 'inside' })!, parent: 'group' },
    },
    flatOrder: ['first', 'group', 'inside', 'second'],
  };
  await render();
  expect(container.querySelector('[data-testid="scroller"]')!.getAttribute('data-entries')!.split(',')).toContain(
    'inside',
  );
  expect(scrollToIndex).toHaveBeenLastCalledWith(expect.objectContaining({ index: 2 }));
});
