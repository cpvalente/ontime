// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { useRundownKeyboard } from '../useRundownKeyboard';

vi.mock('../../useEventSelection', () => ({ useEventSelection: () => vi.fn() }));

const cloneEntry = vi.fn();

function Panel({ enabled }: { enabled: boolean }) {
  useRundownKeyboard({
    enabled,
    cursor: 'entry',
    commands: {
      selectEntry: vi.fn(),
      selectGroup: vi.fn(),
      selectEdge: vi.fn(),
      selectPage: vi.fn(),
      cloneEntry,
      moveEntry: vi.fn(),
      deleteAtCursor: vi.fn(),
      insertAtId: vi.fn(),
      insertCopyAtId: vi.fn(),
    },
    clearSelectedEvents: vi.fn(),
    setEntryCopyId: vi.fn(),
    jumpToCurrent: vi.fn(),
    followMove: vi.fn(),
  });
  return null;
}

let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  cloneEntry.mockClear();
  root = createRoot(document.createElement('div'));
});

afterEach(async () => {
  await act(async () => root.unmount());
});

function pressClone() {
  document.documentElement.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'd', code: 'KeyD', ctrlKey: true, metaKey: true, bubbles: true }),
  );
}

describe('useRundownKeyboard', () => {
  it('handles shortcuts in the panel the user works in', async () => {
    await act(async () => root.render(<Panel enabled />));
    pressClone();
    expect(cloneEntry).toHaveBeenCalledWith('entry');
  });

  it('ignores shortcuts in the other panel', async () => {
    await act(async () => root.render(<Panel enabled={false} />));
    pressClone();
    expect(cloneEntry).not.toHaveBeenCalled();
  });

  it('follows the panel as the user moves between them', async () => {
    await act(async () => root.render(<Panel enabled />));
    await act(async () => root.render(<Panel enabled={false} />));
    pressClone();
    expect(cloneEntry).not.toHaveBeenCalled();

    await act(async () => root.render(<Panel enabled />));
    pressClone();
    expect(cloneEntry).toHaveBeenCalledTimes(1);
  });
});
