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

const authenticationMocks = vi.hoisted(() => ({ reject: true, scope: 'write' as AccessScope }));

vi.mock('ws', () => ({
  WebSocket: websocketMocks.FakeWebSocket,
  WebSocketServer: websocketMocks.FakeWebSocketServer,
}));

vi.mock('../../middleware/authenticate.js', () => ({
  authenticateSocket: () => (authenticationMocks.reject ? undefined : authenticationMocks.scope),
}));

import { MessageTag } from 'ontime-types';

import { now } from '../../lib/time-core/timeCore.js';
import type { AccessScope } from '../../middleware/access.js';
import { removeToken, socket } from '../WebsocketAdapter.js';

describe('WebsocketAdapter', () => {
  beforeEach(() => {
    authenticationMocks.reject = true;
    authenticationMocks.scope = 'write';
  });

  afterEach(async () => {
    await socket.shutdown();
    vi.useRealTimers();
  });

  it('handles an error emitted while rejecting an unauthenticated socket', () => {
    socket.init({} as Server, null);
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
    socket.init({} as Server, null);
    const client = new websocketMocks.FakeWebSocket();
    websocketMocks.getLatestServer()?.clients.add(client);
    websocketMocks.getConnectionHandler()?.(client, {});

    // Not every integration replies to pings, clients own reconnecting
    vi.advanceTimersByTime(5 * 60_000);
    expect(client.terminate).not.toHaveBeenCalled();
    expect(client.close).not.toHaveBeenCalled();
  });

  it('replies to a Ping by echoing its payload with the server epoch', () => {
    vi.useFakeTimers({ now: new Date(2026, 0, 1, 12, 30) });
    authenticationMocks.reject = false;
    socket.init({} as Server, null);
    const client = new websocketMocks.FakeWebSocket();
    websocketMocks.getConnectionHandler()?.(client, {});

    client.emit('message', JSON.stringify({ tag: MessageTag.Ping, payload: 1234.5 }));

    expect(client.send).toHaveBeenLastCalledWith(
      JSON.stringify({ tag: MessageTag.Pong, payload: 1234.5, epoch: now() }),
    );
  });

  function connect(scope: AccessScope) {
    authenticationMocks.reject = false;
    authenticationMocks.scope = scope;
    const client = new websocketMocks.FakeWebSocket();
    websocketMocks.getLatestServer()?.clients.add(client);
    websocketMocks.getConnectionHandler()?.(client, {});
    return client;
  }

  function sentPackets(client: InstanceType<typeof websocketMocks.FakeWebSocket>) {
    return client.send.mock.calls.map(([data]) => JSON.parse(data as string));
  }

  function lastClientList(client: InstanceType<typeof websocketMocks.FakeWebSocket>) {
    return sentPackets(client)
      .filter((packet) => packet.tag === MessageTag.ClientList)
      .at(-1)?.payload;
  }

  function clientId(client: InstanceType<typeof websocketMocks.FakeWebSocket>): string {
    return sentPackets(client).find((packet) => packet.tag === MessageTag.ClientInit)?.payload.clientId;
  }

  function flush() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  it('sends the full client list only to write sockets, others see themselves', () => {
    socket.init({} as Server, null);
    const writer = connect('write');
    const reader = connect('read');

    expect(Object.keys(lastClientList(writer))).toHaveLength(2);
    expect(Object.keys(lastClientList(reader))).toEqual([clientId(reader)]);
  });

  it('keeps tokens out of client paths', () => {
    socket.init({} as Server, null);
    const writer = connect('write');

    writer.emit('message', JSON.stringify({ tag: MessageTag.ClientSet, payload: { path: '/timer?token=secret&n=1' } }));

    const [self] = Object.values(lastClientList(writer)) as { path: string }[];
    expect(self.path).toBe('/timer?n=1');
  });

  it('keeps only the fields a client may set about itself, capped in length', () => {
    socket.init({} as Server, null);
    const writer = connect('write');
    const reader = connect('read');

    reader.emit(
      'message',
      JSON.stringify({ tag: MessageTag.ClientSet, payload: { name: 'x'.repeat(500), identify: true, extra: 1 } }),
    );

    const entry = lastClientList(writer)[clientId(reader)];
    expect(entry.name).toHaveLength(100);
    expect(entry.identify).toBe(false);
    expect(entry).not.toHaveProperty('extra');
  });

  it('lets a read socket rename itself but not another client', async () => {
    socket.init({} as Server, null);
    const writer = connect('write');
    const reader = connect('read');

    reader.emit('message', JSON.stringify({ tag: 'client', payload: { target: clientId(reader), rename: 'me' } }));
    reader.emit('message', JSON.stringify({ tag: 'client', payload: { target: clientId(writer), rename: 'you' } }));
    await flush();

    const list = lastClientList(writer);
    expect(list[clientId(reader)].name).toBe('me');
    expect(list[clientId(writer)].name).not.toBe('you');
  });

  it('does not let a read socket redirect itself', async () => {
    socket.init({} as Server, null);
    const reader = connect('read');

    reader.emit('message', JSON.stringify({ tag: 'client', payload: { target: clientId(reader), redirect: '/x' } }));
    await flush();

    expect(sentPackets(reader).some((packet) => packet.tag === MessageTag.ClientRedirect)).toBe(false);
  });

  it('sends renames and redirects only to write sockets and their target', async () => {
    socket.init({} as Server, null);
    const writer = connect('write');
    const target = connect('read');
    const bystander = connect('read');

    writer.emit('message', JSON.stringify({ tag: 'client', payload: { target: clientId(target), rename: 'stage' } }));
    writer.emit(
      'message',
      JSON.stringify({ tag: 'client', payload: { target: clientId(target), redirect: '/timer?token=abc' } }),
    );
    await flush();

    const redirect = sentPackets(target).find((packet) => packet.tag === MessageTag.ClientRedirect);
    expect(redirect?.payload.path).toBe('/timer');
    expect(sentPackets(writer).some((packet) => packet.tag === MessageTag.ClientRename)).toBe(true);
    expect(
      sentPackets(bystander).some(
        (packet) => packet.tag === MessageTag.ClientRename || packet.tag === MessageTag.ClientRedirect,
      ),
    ).toBe(false);
  });

  it('removes a client from the list when it disconnects', () => {
    socket.init({} as Server, null);
    const writer = connect('write');
    const reader = connect('read');

    reader.emit('close');

    expect(Object.keys(lastClientList(writer))).toEqual([clientId(writer)]);
  });

  it('sends the welcome dialog to a write socket only', () => {
    socket.init({} as Server, { loaded: 'demo project' } as never);
    const reader = connect('read');
    reader.emit('message', JSON.stringify({ tag: MessageTag.ClientSetPath, payload: '/editor' }));
    const writer = connect('write');
    writer.emit('message', JSON.stringify({ tag: MessageTag.ClientSetPath, payload: '/editor' }));

    expect(sentPackets(reader).some((packet) => packet.tag === MessageTag.Dialog)).toBe(false);
    expect(sentPackets(writer).some((packet) => packet.tag === MessageTag.Dialog)).toBe(true);
  });
});

describe('removeToken()', () => {
  it.each([
    ['/timer', '/timer'],
    ['/timer?n=1', '/timer?n=1'],
    ['/timer?token=abc', '/timer'],
    ['/timer?n=1&token=abc', '/timer?n=1'],
    ['/timer?tok%65n=abc&n=a+b', '/timer?n=a+b'],
    ['/timer?token=a&token=b', '/timer'],
    ['/timer?a=1#token=x', '/timer?a=1'],
    ['/timer?TOKEN=x', '/timer?TOKEN=x'],
  ])('%s becomes %s', (path, expected) => {
    expect(removeToken(path)).toBe(expected);
  });
});
