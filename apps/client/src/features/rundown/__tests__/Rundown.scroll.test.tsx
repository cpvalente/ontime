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
vi.mock('../../../common/context/RundownScopeContext', () => ({
  useRundownScope: () => scope,
  useIsActiveRundownScope: () => true,
}));
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

// the collapsed groups store syncs through this event, as when the user collapses a group
function collapseGroups(groupIds: string[]) {
  window.dispatchEvent(
    new CustomEvent('mantine-session-storage', {
      detail: { key: 'rundown.test-editor-collapsed-groups', value: groupIds },
    }),
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
  scope = {
    scopeId: 'scope',
    rundownId: 'test',
    isLoaded: true,
    selectionStore: createEventSelectionStore(() => undefined),
  };
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

function scroller() {
  return container.querySelector('[data-testid="scroller"]')!;
}

function visibleEntries() {
  return scroller().getAttribute('data-entries')!.split(',');
}

function press(code: string, modifiers: KeyboardEventInit = {}) {
  const key = code.replace('Key', '').toLowerCase();
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true, ...modifiers }));
}

function pressMove(direction: 'up' | 'down') {
  const code = direction === 'up' ? 'ArrowUp' : 'ArrowDown';
  document.body.dispatchEvent(
    new KeyboardEvent('keydown', { key: code, code, altKey: true, ctrlKey: true, bubbles: true }),
  );
}

function withOrder(order: string[]) {
  props = { ...props, order, flatOrder: order };
}

function editEntry(id: string) {
  props = { ...props, entries: { ...props.entries, [id]: createEvent({ id, title: 'edited' })! } };
}

describe('Run mode follow', () => {
  it('suspends following after keyboard scrolling and resumes on the next event', async () => {
    await render();
    scrollToIndex.mockClear();

    scroller().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    editEntry('first');
    await render();
    expect(scrollToIndex).not.toHaveBeenCalled();

    props = { ...props, featureData: { ...props.featureData, selectedEventId: 'second' } };
    await render();
    expect(scrollToIndex).toHaveBeenLastCalledWith(expect.objectContaining({ index: 1 }));
  });

  it('keeps following when the user clicks a row', async () => {
    const row = document.createElement('div');
    await render();
    scroller().append(row);
    scrollToIndex.mockClear();

    row.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    editEntry('first');
    await render();
    expect(scrollToIndex).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
  });

  it('resumes following with Alt+L after the user scrolled', async () => {
    await render();
    scroller().dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true }));
    scrollToIndex.mockClear();

    await act(async () => press('KeyL', { altKey: true }));
    expect(scrollToIndex).toHaveBeenCalledWith(expect.objectContaining({ index: 0, align: 'start' }));

    scrollToIndex.mockClear();
    editEntry('second');
    await render();
    expect(scrollToIndex).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
  });

  it('stops following after an explicit jump', async () => {
    await render();
    await act(async () => scope.selectionStore.getState().scrollToEntry('second'));
    expect(scrollIntoView).toHaveBeenLastCalledWith(expect.objectContaining({ index: 1 }));
    scrollToIndex.mockClear();

    editEntry('first');
    await render();
    expect(scrollToIndex).not.toHaveBeenCalled();
  });

  describe('when the live event moves into a collapsed group', () => {
    beforeEach(async () => {
      sessionStorage.setItem('rundown.test-editor-collapsed-groups', JSON.stringify(['group']));
      props = { ...props, entries: { ...props.entries, group: createGroup({ id: 'group', entries: [] }) } };
      withOrder(['first', 'group', 'second']);
      await render();
    });

    async function moveLiveIntoGroup() {
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
    }

    it('opens the group and pins the event while following', async () => {
      await moveLiveIntoGroup();
      expect(visibleEntries()).toContain('first');
      expect(scrollToIndex).toHaveBeenLastCalledWith(expect.objectContaining({ index: 1 }));
    });

    it('keeps a group the user collapsed closed when the next event inside it goes live', async () => {
      await moveLiveIntoGroup();
      props = {
        ...props,
        entries: {
          ...props.entries,
          second: { ...createEvent({ id: 'second' })!, parent: 'group' },
          group: createGroup({ id: 'group', entries: ['first', 'second'] }),
        },
        order: ['group'],
        flatOrder: ['group', 'first', 'second'],
      };
      await render();
      await act(async () => collapseGroups(['group']));
      props = { ...props, featureData: { ...props.featureData, selectedEventId: 'second' } };
      await render();
      expect(visibleEntries()).not.toContain('second');
    });

    it('opens the group without scrolling after the user scrolled', async () => {
      scroller().dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true }));
      await moveLiveIntoGroup();
      expect(visibleEntries()).toContain('first');
      expect(scrollToIndex).not.toHaveBeenCalled();
    });
  });

  it('opens a collapsed group when the live entry arrives after its runtime selection', async () => {
    sessionStorage.setItem('rundown.test-editor-collapsed-groups', JSON.stringify(['group']));
    props = { ...props, entries: { ...props.entries, group: createGroup({ id: 'group', entries: [] }) } };
    withOrder(['first', 'group', 'second']);
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
    expect(visibleEntries()).toContain('inside');
    expect(scrollToIndex).toHaveBeenLastCalledWith(expect.objectContaining({ index: 2 }));
  });
});

describe('Edit mode reveals', () => {
  beforeEach(() => {
    mode = AppMode.Edit;
  });

  it('opens a collapsed group when the selected entry moves into it', async () => {
    sessionStorage.setItem('rundown.test-editor-collapsed-groups', JSON.stringify(['group']));
    props = { ...props, entries: { ...props.entries, group: createGroup({ id: 'group', entries: [] }) } };
    withOrder(['first', 'group', 'second']);
    scope.selectionStore.getState().setSingleEntrySelection({ id: 'first' });
    await render();
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
    expect(visibleEntries()).toContain('first');
  });

  it('reveals a finder target after expanding its group', async () => {
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
    expect(visibleEntries()).toEqual(['group']);
    await act(async () => container.querySelector('button')!.click());
    expect(scrollIntoView).toHaveBeenLastCalledWith(expect.objectContaining({ index: 1 }));
    expect(visibleEntries()).toContain('inside');
  });

  it('does not scroll when selecting or editing a row', async () => {
    await render();

    await act(async () => scope.selectionStore.getState().setSingleEntrySelection({ id: 'second' }));
    editEntry('second');
    await render();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollToIndex).not.toHaveBeenCalled();
  });

  it('reveals the latest cursor when entering Edit mode', async () => {
    mode = AppMode.Run;
    await render();
    await act(async () => scope.selectionStore.getState().setSingleEntrySelection({ id: 'second' }));
    scrollIntoView.mockClear();

    mode = AppMode.Edit;
    await render();
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ index: 1 }));
  });
});

describe('Edit mode keyboard moves', () => {
  // like production, a move settles after the optimistic order update has rendered
  let settleMoves: (() => void)[];

  beforeEach(() => {
    mode = AppMode.Edit;
    props = { ...props, entries: { ...props.entries, third: createEvent({ id: 'third' })! } };
    withOrder(['first', 'second', 'third']);
    scope.selectionStore.getState().setSingleEntrySelection({ id: 'first' });
    settleMoves = [];
    move.mockImplementation(() => new Promise<void>((resolve) => settleMoves.push(resolve)));
  });

  afterEach(() => {
    move.mockReset();
  });

  async function settleAll() {
    await act(async () => settleMoves.splice(0).forEach((settle) => settle()));
  }

  it('reveals the new index once the move and its order update render together', async () => {
    await render();
    scrollIntoView.mockClear();

    await act(async () => pressMove('down'));
    expect(move).toHaveBeenCalledWith('first', 'down');
    expect(scrollIntoView).not.toHaveBeenCalled();

    withOrder(['second', 'first', 'third']);
    await render();
    await settleAll();
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ index: 1 }));
  });

  it('follows the moved entry through queued moves', async () => {
    await render();
    await act(async () => {
      pressMove('down');
      pressMove('down');
    });
    scrollIntoView.mockClear();

    withOrder(['second', 'first', 'third']);
    await render();
    expect(scrollIntoView).toHaveBeenLastCalledWith(expect.objectContaining({ index: 1 }));
    withOrder(['second', 'third', 'first']);
    await render();
    expect(scrollIntoView).toHaveBeenLastCalledWith(expect.objectContaining({ index: 2 }));
  });

  it('stops following once the moves have settled', async () => {
    await render();
    await act(async () => pressMove('down'));
    withOrder(['second', 'first', 'third']);
    await render();
    await settleAll();
    scrollIntoView.mockClear();

    // a later edit above the moved entry
    withOrder(['third', 'second', 'first']);
    await render();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('stops following when a queued move turns out to be a no-op', async () => {
    scope.selectionStore.getState().setSingleEntrySelection({ id: 'second' });
    await render();
    await act(async () => {
      pressMove('down');
      pressMove('down');
    });

    // only the first move changes the order, the second one was already at the end
    withOrder(['first', 'third', 'second']);
    await render();
    await settleAll();
    scrollIntoView.mockClear();

    withOrder(['third', 'second', 'first']);
    await render();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('does not follow a move past the end of the rundown', async () => {
    scope.selectionStore.getState().setSingleEntrySelection({ id: 'third' });
    await render();
    await act(async () => pressMove('down'));
    await settleAll();
    scrollIntoView.mockClear();

    withOrder(['third', 'first', 'second']);
    await render();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('stops following when switching to Run', async () => {
    await render();
    await act(async () => pressMove('down'));
    scrollIntoView.mockClear();
    mode = AppMode.Run;
    await render();

    withOrder(['second', 'first', 'third']);
    await render();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('preserves newer navigation when a pending move completes', async () => {
    await render();
    await act(async () => pressMove('down'));
    await act(async () => {
      scope.selectionStore.getState().setSelectedEvents({ id: 'second', index: 1, selectMode: 'click' });
      scope.selectionStore.getState().scrollToEntry('second');
    });
    scrollIntoView.mockClear();

    withOrder(['second', 'first', 'third']);
    await render();
    await settleAll();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
