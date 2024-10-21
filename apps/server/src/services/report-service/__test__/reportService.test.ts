import { PlayableEvent, Playback, ReportData } from 'ontime-types';
import { clear, eventStart, eventStop, generate } from '../ReportService.js';
import { RuntimeState } from '../../../stores/runtimeState.js';

let mockState = {} as RuntimeState;

const blankReportData: ReportData = {
  startAt: null,
  endAt: null,
  overUnder: null,
} as const;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);

  mockState = {
    clock: 666,
    eventNow: null,
    publicEventNow: null,
    eventNext: null,
    publicEventNext: null,
    runtime: {
      selectedEventIndex: null,
      numEvents: 0,
    },
    timer: {
      addedTime: 0,
      current: null,
      duration: null,
      elapsed: null,
      expectedFinish: null,
      finishedAt: null,
      playback: Playback.Stop,
      secondaryTimer: null,
      startedAt: null,
    },
    _timer: {
      pausedAt: null,
    },
  } as RuntimeState;

  clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('reporter', () => {
  test('clear', async () => {
    expect(generate()).toMatchObject({});
  });

  test('event start', async () => {
    mockState.eventNow = { id: 'test' } as PlayableEvent;
    mockState.timer.startedAt = 666;
    eventStart(mockState);
    expect(generate()).toMatchObject({ test: { ...blankReportData, startAt: 666 } });
  });

  test('event stop', async () => {
    mockState.eventNow = { id: 'test', duration: 500 } as PlayableEvent;
    mockState.timer.startedAt = 666;
    eventStart(mockState);
    expect(generate()).toMatchObject({ test: { ...blankReportData, startAt: 666 } });

    mockState.clock = 1666;
    eventStop(mockState);
    expect(generate()).toMatchObject({ test: { ...blankReportData, startAt: 666, endAt: 1666, overUnder: 500 } });
  });
});
