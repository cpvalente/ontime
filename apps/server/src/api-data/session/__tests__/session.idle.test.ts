import { Playback } from 'ontime-types';

import { clearActivity, trackActivity } from '../../../services/activity-service/activity.service.js';
import { getIdleState } from '../session.service.js';

const socketStats = {
  connectedClients: 0,
  lastConnection: null as Date | null,
  lastDisconnection: null as Date | null,
};
let playback = Playback.Stop;

vi.mock('../../../adapters/WebsocketAdapter.js', () => ({
  socket: { getStats: () => socketStats },
}));

vi.mock('../../../services/runtime-service/runtime.service.js', () => ({
  runtimeService: { getRuntimeState: () => ({ playback }) },
}));

describe('getIdleState()', () => {
  beforeEach(() => {
    socketStats.connectedClients = 0;
    socketStats.lastConnection = null;
    socketStats.lastDisconnection = null;
    playback = Playback.Stop;
    clearActivity();
  });

  it('is not idle while a client is connected', () => {
    socketStats.connectedClients = 1;
    // a client which connected long ago is still a client in the room
    socketStats.lastConnection = new Date('2024-01-01T10:00:00.000Z');

    expect(getIdleState()).toStrictEqual({ idle: false, idleSince: null });
  });

  it.each([Playback.Play, Playback.Pause, Playback.Roll])(
    'is not idle while the timer is %s, even without clients',
    (runningPlayback) => {
      playback = runningPlayback;

      expect(getIdleState()).toStrictEqual({ idle: false, idleSince: null });
    },
  );

  it('is idle when an event is armed, the runtime is restored on startup', () => {
    playback = Playback.Armed;

    expect(getIdleState().idle).toBe(true);
  });

  it('reports idleness since the last client left, not since it connected', () => {
    socketStats.lastConnection = new Date('2024-01-01T10:00:00.000Z');
    socketStats.lastDisconnection = new Date('2024-01-01T18:00:00.000Z');

    expect(getIdleState()).toStrictEqual({ idle: true, idleSince: '2024-01-01T18:00:00.000Z' });
  });

  it('accounts for interactions which happen without a websocket client', () => {
    socketStats.lastDisconnection = new Date('2024-01-01T18:00:00.000Z');
    vi.setSystemTime(new Date('2024-01-02T09:00:00.000Z'));
    trackActivity();

    expect(getIdleState()).toStrictEqual({ idle: true, idleSince: '2024-01-02T09:00:00.000Z' });
    vi.useRealTimers();
  });

  it('falls back to the server start time when there was never an interaction', () => {
    const { idle, idleSince } = getIdleState();

    expect(idle).toBe(true);
    expect(idleSince).not.toBeNull();
  });
});
