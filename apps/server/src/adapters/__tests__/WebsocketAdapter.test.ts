import type { Server } from 'node:http';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const websocketMocks = vi.hoisted(() => {
  let connectionHandler: ((socket: FakeWebSocket, request: unknown) => void) | undefined;
  let latestServer: FakeWebSocketServer | undefined;

  class FakeWebSocket {
    static readonly OPEN = 1;

    readyState = FakeWebSocket.OPEN;
    close = vi.fn();
    ping = vi.fn();
    send = vi.fn();
    terminate = vi.fn();
    handlers = new Map<string, Array<(...args: unknown[]) => void>>();

    on(event: string, handler: (...args: unknown[]) => void) {
      this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]);
      return this;
    }

    emit(event: string, ...args: unknown[]) {
      const handlers = this.handlers.get(event) ?? [];
      if (event === 'error' && handlers.length === 0) {
        throw args[0];
      }
      for (const handler of handlers) {
        handler(...args);
      }
    }
  }

  class FakeWebSocketServer {
    clients = new Set<FakeWebSocket>();

    constructor() {
      latestServer = this;
    }

    on(event: string, handler: (socket: FakeWebSocket, request: unknown) => void) {
      if (event === 'connection') {
        connectionHandler = handler;
      }
      return this;
    }

    close(callback: () => void) {
      callback();
    }
  }

  return {
    FakeWebSocket,
    FakeWebSocketServer,
    getConnectionHandler: () => connectionHandler,
    getLatestServer: () => latestServer,
  };
});

const authenticationMocks = vi.hoisted(() => ({ reject: true }));

vi.mock('ws', () => ({
  WebSocket: websocketMocks.FakeWebSocket,
  WebSocketServer: websocketMocks.FakeWebSocketServer,
}));

vi.mock('../../middleware/authenticate.js', () => ({
  authenticateSocket: (_socket: unknown, _request: unknown, next: (error?: Error) => void) => {
    next(authenticationMocks.reject ? new Error('Unauthorized') : undefined);
  },
}));

import { MessageTag } from 'ontime-types';

import { logger } from '../../classes/Logger.js';
import { socket } from '../WebsocketAdapter.js';

describe('WebsocketAdapter', () => {
  beforeEach(() => {
    authenticationMocks.reject = true;
  });

  afterEach(async () => {
    await socket.shutdown();
    vi.useRealTimers();
  });

  it('handles an error emitted while rejecting an unauthenticated socket', () => {
    socket.init({} as Server, false);
    const rejectedSocket = new websocketMocks.FakeWebSocket();
    const connectionHandler = websocketMocks.getConnectionHandler();

    expect(connectionHandler).toBeDefined();
    connectionHandler?.(rejectedSocket, {});

    expect(rejectedSocket.close).toHaveBeenCalledWith(1008, 'Unauthorized');
    expect(() => rejectedSocket.emit('error', new Error('socket closed'))).not.toThrow();
  });

  it('keeps a client connected when it does not answer protocol pings', () => {
    vi.useFakeTimers();
    authenticationMocks.reject = false;
    socket.init({} as Server, false);
    const client = new websocketMocks.FakeWebSocket();
    websocketMocks.getLatestServer()?.clients.add(client);
    websocketMocks.getConnectionHandler()?.(client, {});

    // Not every integration replies to pings, clients own reconnecting
    vi.advanceTimersByTime(5 * 60_000);
    expect(client.terminate).not.toHaveBeenCalled();
    expect(client.close).not.toHaveBeenCalled();
  });

  it('sends the log history to a connecting client right after its init', () => {
    authenticationMocks.reject = false;
    socket.init({} as Server, false);
    logger.info('test', 'happened before the client connected');
    const client = new websocketMocks.FakeWebSocket();
    websocketMocks.getConnectionHandler()?.(client, {});

    const tags = client.send.mock.calls.map(([raw]) => JSON.parse(raw as string).tag);
    expect(tags.indexOf(MessageTag.LogHistory)).toBe(tags.indexOf(MessageTag.ClientInit) + 1);

    const history = client.send.mock.calls
      .map(([raw]) => JSON.parse(raw as string))
      .find((packet) => packet.tag === MessageTag.LogHistory);
    expect(history.payload).toEqual(logger.getHistory());
    expect(history.payload.some((log: { text: string }) => log.text === 'happened before the client connected')).toBe(
      true,
    );
  });
});
