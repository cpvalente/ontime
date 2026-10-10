// @vitest-environment happy-dom
import { MessageTag } from 'ontime-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getRundownQueryKey } from '../../api/constants';
import { ontimeQueryClient } from '../../queryClient';
import { addLog } from '../../stores/logger';
import { maybeInvalidateRundownCache, socketConfig } from '../socket';

const { watchdogInterval, silenceTimeout, connectTimeout } = socketConfig;

/** The clock is the server's regular sign of life. */
const PUBLISH_INTERVAL = 1000;

/** Browser WebSocket stand-in that can stop delivering without closing. */
class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.CONNECTING;
  sent: string[] = [];

  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  constructor(public readonly url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  /** Simulates a lost connection without an onclose event. */
  closeSilently() {
    this.readyState = MockWebSocket.CLOSED;
  }
  open() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  receive(tag: MessageTag, payload: unknown, clock?: number) {
    this.onmessage?.({ data: JSON.stringify({ tag, payload, clock }) });
  }
}

vi.mock('../../api/utils', () => ({ invalidateAllCaches: vi.fn<() => Promise<void>>() }));
vi.mock('../../stores/logger', () => ({ addLog: vi.fn() }));

describe('socket connection watchdog', () => {
  let connectSocket: () => void;
  let getReconnectAttempts: () => number;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'] });
    MockWebSocket.instances = [];
    vi.mocked(addLog).mockClear();
    vi.stubGlobal('WebSocket', MockWebSocket);
    // the module keeps connection state in module scope, we need a clean one for each test
    vi.resetModules();
    const socketModule = await import('../socket');
    connectSocket = socketModule.connectSocket;
    getReconnectAttempts = socketModule.getReconnectAttempts;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /** Opens a connection and returns its socket. */
  function openConnection() {
    connectSocket();
    const socket = MockWebSocket.instances[0];
    socket.open();
    return socket;
  }

  it('holds a connection which keeps delivering data', () => {
    const socket = openConnection();

    // Runtime clock updates keep the connection alive without client polling.
    for (let elapsed = 0; elapsed < silenceTimeout * 3; elapsed += PUBLISH_INTERVAL) {
      vi.advanceTimersByTime(PUBLISH_INTERVAL);
      socket.receive(MessageTag.RuntimeData, { clock: elapsed });
    }

    expect(socket.sent.filter((packet) => JSON.parse(packet).tag === MessageTag.ClientSet)).toHaveLength(1);
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it('samples the server clock quickly after connecting, then rarely once the offset is known', async () => {
    const { useAutoTickingClock } = await import('../../stores/clockStore');
    const socket = openConnection();
    const pings = () => socket.sent.map((packet) => JSON.parse(packet)).filter(({ tag }) => tag === MessageTag.Ping);

    for (let sample = 0; sample < 5; sample++) {
      socket.receive(MessageTag.Pong, pings().at(-1).payload, performance.now() + 10000);
      vi.advanceTimersByTime(socketConfig.pingInterval);
    }
    expect(useAutoTickingClock.getState()).toBe(performance.now() + 10000);
    // the ping scheduled before the fifth reply still went out
    expect(pings()).toHaveLength(6);

    // the server keeps publishing, so the watchdog keeps the connection
    for (let elapsed = 0; elapsed < socketConfig.pingIdleInterval; elapsed += PUBLISH_INTERVAL) {
      vi.advanceTimersByTime(PUBLISH_INTERVAL);
      socket.receive(MessageTag.RuntimeData, {});
    }
    expect(pings()).toHaveLength(7);
  });

  it('seeds local ticking from a published clock before the first Pong', async () => {
    const { useAutoTickingClock } = await import('../../stores/clockStore');
    const socket = openConnection();
    socket.receive(MessageTag.RuntimeData, { clock: 10000 });
    expect(useAutoTickingClock.getState()).toBe(10000);
  });

  it('replaces a connection which stops delivering data without closing', () => {
    const socket = openConnection();

    vi.advanceTimersByTime(PUBLISH_INTERVAL);
    socket.receive(MessageTag.RuntimeData, { clock: 0 });

    // The browser still considers this socket open.
    vi.advanceTimersByTime(silenceTimeout);
    expect(socket.readyState).toBe(MockWebSocket.OPEN);

    vi.advanceTimersByTime(watchdogInterval);
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);

    vi.advanceTimersByTime(socketConfig.reconnectBaseInterval * 2);
    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it('backs off after a connection attempt which never completes', () => {
    connectSocket();
    const socket = MockWebSocket.instances[0];

    // The socket neither opens nor reports an error.
    vi.advanceTimersByTime(connectTimeout + watchdogInterval);

    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(getReconnectAttempts()).toBe(0);

    vi.advanceTimersByTime(socketConfig.reconnectBaseInterval * 2);
    expect(MockWebSocket.instances).toHaveLength(2);
    expect(getReconnectAttempts()).toBe(1);
  });

  it('logs one warning while repeated connection attempts time out', () => {
    connectSocket();

    vi.advanceTimersByTime(connectTimeout + watchdogInterval + socketConfig.reconnectBaseInterval * 2);
    vi.advanceTimersByTime(connectTimeout + watchdogInterval);

    expect(addLog).toHaveBeenCalledOnce();
  });

  it('does not open a second connection while one is alive', () => {
    openConnection();

    connectSocket();

    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it('reconnects after the socket closes', () => {
    const socket = openConnection();

    socket.close();
    expect(MockWebSocket.instances).toHaveLength(1);

    // Reconnection uses the same backoff policy.
    vi.advanceTimersByTime(socketConfig.reconnectBaseInterval * 2);
    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it('recovers when a close goes unreported', () => {
    const socket = openConnection();

    // The watchdog is the only recovery path when no close event arrives.
    socket.closeSilently();

    vi.advanceTimersByTime(watchdogInterval + socketConfig.reconnectBaseInterval * 2);
    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it('ignores events from a socket which has been replaced', () => {
    const stale = openConnection();

    vi.advanceTimersByTime(silenceTimeout + watchdogInterval);
    vi.advanceTimersByTime(socketConfig.reconnectBaseInterval * 2);
    expect(MockWebSocket.instances).toHaveLength(2);
    MockWebSocket.instances[1].open();

    // A late close from the old socket must not disturb its replacement.
    stale.close();

    vi.advanceTimersByTime(watchdogInterval);
    expect(MockWebSocket.instances).toHaveLength(2);
  });
});

describe('what the client tells the user about the connection', () => {
  let connectSocket: () => void;
  let ConnectionStatus: typeof import('../../stores/connectionStore').ConnectionStatus;
  let getNotice: () => ReturnType<typeof import('../../stores/connectionStore').useConnectionStore.getState>;

  beforeEach(async () => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
    vi.resetModules();
    const socketModule = await import('../socket');
    const connectionModule = await import('../../stores/connectionStore');
    connectSocket = socketModule.connectSocket;
    ConnectionStatus = connectionModule.ConnectionStatus;
    getNotice = () => connectionModule.useConnectionStore.getState();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /** Opens a connection and returns its socket. */
  function openConnection() {
    connectSocket();
    const socket = MockWebSocket.instances.at(-1) as MockWebSocket;
    socket.open();
    return socket;
  }

  /** Runs the clock until the pending backoff produces a new connection attempt. */
  function awaitNextAttempt() {
    const attemptsSoFar = MockWebSocket.instances.length;
    while (MockWebSocket.instances.length === attemptsSoFar) {
      vi.advanceTimersByTime(watchdogInterval);
    }
    return MockWebSocket.instances.at(-1) as MockWebSocket;
  }

  /** Refuses the given amount of connection attempts, the way a server which is down would. */
  function refuseAttempts(amount: number) {
    for (let attempt = 0; attempt < amount; attempt += 1) {
      awaitNextAttempt().close();
    }
  }

  it('says nothing about an interruption which recovers within the quiet retries', () => {
    const socket = openConnection();

    socket.close();
    awaitNextAttempt().open();

    expect(getNotice()).toEqual({ status: ConnectionStatus.Connected, recoveredAt: null });
  });

  it('reports an interruption which outlasts the quiet retries', () => {
    const socket = openConnection();

    socket.close();
    refuseAttempts(socketConfig.attemptsBeforeNotice);

    expect(getNotice().status).toBe(ConnectionStatus.Reconnecting);
  });

  it('gives up on the retries at the moment the data is flagged stale', async () => {
    const { runtimeStore } = await import('../../stores/runtime');
    const socket = openConnection();

    socket.close();
    refuseAttempts(socketConfig.offlineAttemptsThreshold + 2);

    expect(getNotice().status).toBe(ConnectionStatus.Disconnected);
    expect(runtimeStore.getState().ping).toBeLessThan(0);
  });

  it('confirms a recovery the user was told about', () => {
    const socket = openConnection();

    socket.close();
    refuseAttempts(socketConfig.attemptsBeforeNotice);
    awaitNextAttempt().open();

    expect(getNotice().status).toBe(ConnectionStatus.Connected);
    expect(getNotice().recoveredAt).not.toBeNull();
  });
});

describe('maybeInvalidateRundownCache()', () => {
  const queryKey = getRundownQueryKey('rundown');

  beforeEach(() => {
    ontimeQueryClient.clear();
    ontimeQueryClient.setQueryData(queryKey, { revision: 5 });
  });

  afterEach(() => {
    ontimeQueryClient.clear();
  });

  it('skips a change the cache already holds', () => {
    maybeInvalidateRundownCache(5, 'rundown');
    expect(ontimeQueryClient.getQueryState(queryKey)?.isInvalidated).toBe(false);
  });

  it('invalidates when the change is newer than the cache', () => {
    maybeInvalidateRundownCache(6, 'rundown');
    expect(ontimeQueryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
  });

  it('invalidates when a fetch in flight may predate the change', () => {
    ontimeQueryClient.getQueryCache().find({ queryKey })?.setState({ fetchStatus: 'fetching' });

    maybeInvalidateRundownCache(5, 'rundown');
    expect(ontimeQueryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
  });
});
