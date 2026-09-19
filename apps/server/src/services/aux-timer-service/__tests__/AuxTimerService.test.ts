import { RuntimeStore } from 'ontime-types';

import { AuxTimerService } from '../AuxTimerService.js';

describe('AuxTimerService', () => {
  let emit: ReturnType<typeof vi.fn>;
  let service: AuxTimerService;

  beforeEach(() => {
    emit = vi.fn();
    service = new AuxTimerService(emit, () => 0);
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
});
