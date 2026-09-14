import { TeleprompterService } from '../TeleprompterService.js';

describe('TeleprompterService', () => {
  test('keeps reported state and makes retries idempotent', () => {
    const service = new TeleprompterService();
    const deliver = vi.fn();
    service.register('view');
    service.report('view', {
      mode: 'controlled',
      playback: 'paused',
      speed: 14,
      isFollowingLoadedEvent: true,
      parkedAt: null,
    });

    service.deliver('view', 'command-1', { type: 'nudge', lines: 1 }, deliver);
    service.deliver('view', 'command-1', { type: 'nudge', lines: 1 }, deliver);

    expect(deliver).toHaveBeenCalledTimes(1);
    expect(service.getState('view')?.mode).toBe('controlled');
    expect(() => service.deliver('view', 'command-1', { type: 'nudge', lines: 2 }, deliver)).toThrow('reused');
  });
});
