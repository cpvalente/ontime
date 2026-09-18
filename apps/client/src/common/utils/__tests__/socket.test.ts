// @vitest-environment happy-dom
import { MessageTag } from 'ontime-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { addLog } from '../../stores/logger';
import { socketConfig } from '../socket';

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

  receive(tag: MessageTag, payload: unknown) {
    this.onmessage?.({ data: JSON.stringify({ tag, payload }) });
  }
}

vi.mock('../../api/utils', () => ({ invalidateAllCaches: vi.fn<() => Promise<void>>() }));
vi.mock('../../stores/logger', () => ({ addLog: vi.fn() }));

describe('socket connection watchdog', () => {
  let connectSocket: () => void;
  let getReconnectAttempts: () => number;

  beforeEach(async () => {
    vi.useFakeTimers();
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

    expect(socket.sent).toHaveLength(1);
    expect(MockWebSocket.instances).toHaveLength(1);
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
