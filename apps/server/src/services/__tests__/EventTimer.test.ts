import * as runtimeState from '../../stores/runtimeState.js';
import { EventTimer } from '../EventTimer.js';

vi.mock('../../stores/runtimeState.js', () => ({
  start: vi.fn<typeof runtimeState.start>(() => true),
  pause: vi.fn<typeof runtimeState.pause>(() => true),
  stop: vi.fn<typeof runtimeState.stop>(() => true),
  addTime: vi.fn<typeof runtimeState.addTime>(() => true),
  update: vi.fn<typeof runtimeState.update>(() => ({ hasTimerFinished: false, hasSecondaryTimerFinished: false })),
  getTimeToNextBoundary: vi.fn<typeof runtimeState.getTimeToNextBoundary>(() => null),
}));

const refresh = 50;

describe('EventTimer boundary scheduling', () => {
  let timer: EventTimer;

  beforeEach(() => {
    vi.useFakeTimers();
    timer = new EventTimer({ refresh, updateInterval: 1000 });
  });

  afterEach(() => {
    timer.shutdown();
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  it('anticipates a boundary which falls inside the current refresh cycle', () => {
    vi.mocked(runtimeState.getTimeToNextBoundary).mockReturnValueOnce(20);
    timer.start();

    vi.advanceTimersByTime(19);
    expect(runtimeState.update).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(runtimeState.update).toHaveBeenCalledTimes(1);
  });

  it('leaves a boundary beyond the current refresh cycle to the regular interval', () => {
    vi.mocked(runtimeState.getTimeToNextBoundary).mockReturnValueOnce(refresh);
    timer.start();

    vi.advanceTimersByTime(refresh - 1);
    expect(runtimeState.update).not.toHaveBeenCalled();
  });

  it('reschedules the boundary after adding time', () => {
    vi.mocked(runtimeState.getTimeToNextBoundary).mockReturnValueOnce(20).mockReturnValueOnce(30);
    timer.start();
    timer.addTime(10);

    vi.advanceTimersByTime(29);
    expect(runtimeState.update).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(runtimeState.update).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['pause', () => timer.pause()],
    ['stop', () => timer.stop()],
    ['shutdown', () => timer.shutdown()],
  ])('clears the scheduled boundary on %s', (_name, action) => {
    vi.mocked(runtimeState.getTimeToNextBoundary).mockReturnValueOnce(20);
    timer.start();
    action();

    vi.advanceTimersByTime(refresh - 1);
    expect(runtimeState.update).not.toHaveBeenCalled();
  });
});

describe('EventTimer with a boundary which is already due', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('does not reschedule it', async () => {
    // fake timers do not surface a tight reschedule loop, it needs real time to elapse
    // eg: a roll pre-roll whose side effects keep failing to load the next event
    vi.mocked(runtimeState.getTimeToNextBoundary).mockReturnValue(-5);
    const timer = new EventTimer({ refresh, updateInterval: 1000 });
    timer.start();

    await new Promise((resolve) => setTimeout(resolve, 300));
    timer.shutdown();

    // ~6 updates expected from the refresh interval
    expect(vi.mocked(runtimeState.update).mock.calls.length).toBeLessThanOrEqual(10);
  });
});
