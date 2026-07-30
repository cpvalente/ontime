import { RuntimeStore } from 'ontime-types';

import { AuxTimerService } from '../AuxTimerService.js';

describe('AuxTimerService', () => {
  describe('loadNames()', () => {
    it('applies the names to each aux timer and broadcasts them', () => {
      const emit = vi.fn();
      const service = new AuxTimerService(emit, () => 0);

      service.loadNames(['Speaker', 'Break', 'Q&A']);

      const patch = emit.mock.calls.at(-1)?.[0] as Partial<RuntimeStore>;
      expect(patch.auxtimer1?.name).toBe('Speaker');
      expect(patch.auxtimer2?.name).toBe('Break');
      expect(patch.auxtimer3?.name).toBe('Q&A');
    });

    it('defaults missing names to an empty string', () => {
      const emit = vi.fn();
      const service = new AuxTimerService(emit, () => 0);

      service.loadNames(['only-one']);

      const patch = emit.mock.calls.at(-1)?.[0] as Partial<RuntimeStore>;
      expect(patch.auxtimer1?.name).toBe('only-one');
      expect(patch.auxtimer2?.name).toBe('');
      expect(patch.auxtimer3?.name).toBe('');
    });

    it('handles names missing from a project file', () => {
      const emit = vi.fn();
      const service = new AuxTimerService(emit, () => 0);

      expect(() => service.loadNames(undefined)).not.toThrow();

      const patch = emit.mock.calls.at(-1)?.[0] as Partial<RuntimeStore>;
      expect(patch.auxtimer1?.name).toBe('');
      expect(patch.auxtimer2?.name).toBe('');
      expect(patch.auxtimer3?.name).toBe('');
    });

    it('keeps the name on the timer through subsequent commands', () => {
      const emit = vi.fn();
      const service = new AuxTimerService(emit, () => 0);

      service.loadNames(['Speaker', '', '']);
      const started = service.start(1);

      expect(started.name).toBe('Speaker');
    });
  });
});
