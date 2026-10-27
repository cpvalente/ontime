import { RuntimeStore, SimpleDirection, SimplePlayback } from 'ontime-types';

import { createAuxTimerService } from '../auxTimer.service.js';

describe('auxTimerService', () => {
  let emit: ReturnType<typeof vi.fn>;
  let save: ReturnType<typeof vi.fn>;
  let service: ReturnType<typeof createAuxTimerService>;

  beforeEach(() => {
    // running timers tick on an interval
    vi.useFakeTimers();
    emit = vi.fn();
    save = vi.fn();
    service = createAuxTimerService(emit, () => 0, save);
  });

  afterEach(() => {
    service.dispose();
    vi.useRealTimers();
  });

  const lastPatch = () => emit.mock.calls.at(-1)?.[0] as Partial<RuntimeStore>;

  it('broadcasts the name of each aux timer', () => {
    service.loadNames(['Speaker', 'Break', 'Q&A']);

    expect(lastPatch().auxtimer1?.name).toBe('Speaker');
    expect(lastPatch().auxtimer2?.name).toBe('Break');
    expect(lastPatch().auxtimer3?.name).toBe('Q&A');
  });

  it('keeps the name when the timer is stopped', () => {
    service.loadNames(['Speaker', '', '']);

    expect(service.stop(1).name).toBe('Speaker');
  });

  it('stops broadcasting ticks when disposed', () => {
    service.start(1);
    vi.advanceTimersByTime(500);
    expect(emit).toHaveBeenCalledTimes(2);

    service.dispose();
    vi.advanceTimersByTime(1000);
    expect(emit).toHaveBeenCalledTimes(2);
  });

  it('saves every timer on each command', () => {
    service.setTime(1000, 2);
    service.start(2);

    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith([
      expect.objectContaining({ playback: SimplePlayback.Stop }),
      expect.objectContaining({ playback: SimplePlayback.Start, duration: 1000, startedAt: 0 }),
      expect.objectContaining({ playback: SimplePlayback.Stop }),
    ]);
  });

  it('resumes from saved timers, keeping the names', () => {
    const stopped = {
      playback: SimplePlayback.Stop,
      direction: SimpleDirection.CountDown,
      duration: 1000,
      value: 1000,
      startedAt: null,
    };

    service.loadNames(['Speaker', '', '']);
    service.resume([{ ...stopped, playback: SimplePlayback.Start, startedAt: -200 }, stopped, stopped]);

    expect(lastPatch().auxtimer1).toMatchObject({ name: 'Speaker', playback: SimplePlayback.Start, current: 800 });
    expect(save).not.toHaveBeenCalled();
  });
});
