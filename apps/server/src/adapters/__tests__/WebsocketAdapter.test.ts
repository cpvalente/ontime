import type { Server } from 'node:http';

import { afterEach, describe, expect, it, vi } from 'vitest';

const websocketMocks = vi.hoisted(() => {
  let connectionHandler: ((socket: FakeWebSocket, request: unknown) => void) | undefined;

  class FakeWebSocket {
    static readonly OPEN = 1;

    readyState = FakeWebSocket.OPEN;
    close = vi.fn();
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
  };
});

vi.mock('ws', () => ({
  WebSocket: websocketMocks.FakeWebSocket,
  WebSocketServer: websocketMocks.FakeWebSocketServer,
}));

vi.mock('../../middleware/authenticate.js', () => ({
  authenticateSocket: (_socket: unknown, _request: unknown, next: (error?: Error) => void) => {
    next(new Error('Unauthorized'));
  },
}));

import { socket } from '../WebsocketAdapter.js';

describe('WebsocketAdapter authentication', () => {
  afterEach(async () => {
    await socket.shutdown();
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
});
