// @vitest-environment happy-dom
import { Playback } from 'ontime-types';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import RundownEventChip from '../composite/RundownEventChip';
import RundownEventPlayback from '../composite/RundownEventPlayback';

const { usePlayback, useReport, startEvent, loadEvent } = vi.hoisted(() => ({
  usePlayback: vi.fn(),
  useReport: vi.fn(),
  startEvent: vi.fn(),
  loadEvent: vi.fn(),
}));

let isRundownLoaded = true;

vi.mock('../../../../common/context/RundownScopeContext', () => ({
  useRundownScope: () => ({ rundownId: 'test', isLoaded: isRundownLoaded }),
}));
vi.mock('../../../../common/context/EntryActionsContext', () => ({
  useEntryActionsContext: () => ({ updateEntry: vi.fn() }),
}));
vi.mock('../../../../common/hooks/useSocket', () => ({
  usePlayback,
  setEventPlayback: { startEvent, loadEvent, start: vi.fn(), pause: vi.fn() },
}));
vi.mock('../../../../common/hooks-query/useReport', () => ({ default: useReport }));
vi.mock('../../../../common/utils/time', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../common/utils/time')>()),
  useTimeUntilExpectedStart: () => 5 * 60_000,
}));

const chipProps = {
  id: 'event',
  timeStart: 0,
  delay: 0,
  dayOffset: 0,
  isPast: false,
  isLoaded: false,
  className: '',
  totalGap: 0,
  isLinkedToLoaded: false,
};

const playbackProps = {
  eventId: 'event',
  skip: false,
  isPlaying: false,
  isPaused: false,
  loaded: false,
  disablePlayback: false,
};

let root: Root;
let container: HTMLDivElement;

async function render(element: React.ReactElement) {
  await act(async () => root.render(element));
}

function getButton(label: string) {
  return container.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.clearAllMocks();
  usePlayback.mockReturnValue(Playback.Play);
  useReport.mockReturnValue({ data: {} });
  isRundownLoaded = true;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe('rows of a rundown which is not loaded', () => {
  it('shows the countdown for the loaded rundown', async () => {
    await render(<RundownEventChip {...chipProps} />);
    expect(container.textContent).toContain('5');
    expect(usePlayback).toHaveBeenCalled();
  });

  it('shows no countdown or report and does not follow playback', async () => {
    isRundownLoaded = false;
    await render(<RundownEventChip {...chipProps} />);
    expect(container.innerHTML).toBe('');
    expect(usePlayback).not.toHaveBeenCalled();
    expect(useReport).not.toHaveBeenCalled();
  });

  it('can start and load entries of the loaded rundown', async () => {
    await render(<RundownEventPlayback {...playbackProps} />);
    await act(async () => getButton('Start event')?.click());
    await act(async () => getButton('Load event')?.click());
    expect(startEvent).toHaveBeenCalledWith('event');
    expect(loadEvent).toHaveBeenCalledWith('event');
    expect(getButton('Start event')?.getAttribute('aria-disabled')).toBe('false');
  });

  it('cannot start or load entries, but keeps the row unchanged', async () => {
    isRundownLoaded = false;
    await render(<RundownEventPlayback {...playbackProps} />);
    await act(async () => getButton('Start event')?.click());
    await act(async () => getButton('Load event')?.click());
    expect(startEvent).not.toHaveBeenCalled();
    expect(loadEvent).not.toHaveBeenCalled();
    expect(getButton('Start event')?.getAttribute('aria-disabled')).toBe('true');
    expect(getButton('Load event')?.getAttribute('aria-disabled')).toBe('true');
  });
});
