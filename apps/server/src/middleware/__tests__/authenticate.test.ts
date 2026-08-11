import type { IncomingMessage } from 'node:http';

import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api-data/session/session.service.js', () => ({
  hasPassword: true,
  hashedPassword: 'valid-token',
}));

import { authenticateSocket, isPublicAssetRequest, makeAuthenticateMiddleware } from '../authenticate.js';

function makeResponse() {
  return {
    redirect: vi.fn(),
    send: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

function makeHeadersWithFailingAuthorization(cookie?: string) {
  return {
    cookie,
    get authorization(): never {
      throw new Error('Authorization header should not be read');
    },
  };
}

describe('isPublicAssetRequest()', () => {
  it('allows root public assets without a prefix', () => {
    expect(isPublicAssetRequest('/site.webmanifest', '')).toBe(true);
    expect(isPublicAssetRequest('/manifest.json', '')).toBe(true);
  });

  it('allows prefixed public assets in cloud deployments', () => {
    expect(isPublicAssetRequest('/stage-hash/site.webmanifest', '/stage-hash')).toBe(true);
    expect(isPublicAssetRequest('/stage-hash/ontime-logo.png?cache=1', '/stage-hash')).toBe(true);
  });

  it('keeps non-public paths protected', () => {
    expect(isPublicAssetRequest('/stage-hash/data', '/stage-hash')).toBe(false);
    expect(isPublicAssetRequest('/backstage', '')).toBe(false);
  });
});

describe('bearer authentication', () => {
  const next = vi.fn() as NextFunction;

  beforeEach(() => {
    next.mockClear();
  });

  it('prioritises cookie authentication for API requests', () => {
    const { authenticate } = makeAuthenticateMiddleware('');
    const req = {
      cookies: { token: JSON.stringify({ token: 'valid-token' }) },
      headers: makeHeadersWithFailingAuthorization(),
      query: {},
    } as unknown as Request;

    expect(() => authenticate(req, makeResponse(), next)).not.toThrow();
    expect(next).toHaveBeenCalledOnce();
  });

  it('prioritises cookie authentication for redirecting routes', () => {
    const { authenticateAndRedirect } = makeAuthenticateMiddleware('');
    const req = {
      cookies: { token: JSON.stringify({ token: 'valid-token' }) },
      headers: makeHeadersWithFailingAuthorization(),
      originalUrl: '/external/image.png',
      query: {},
    } as unknown as Request;

    expect(() => authenticateAndRedirect(req, makeResponse(), next)).not.toThrow();
    expect(next).toHaveBeenCalledOnce();
  });

  it('prioritises cookie authentication for WebSocket handshakes', () => {
    const cookie = `token=${encodeURIComponent(JSON.stringify({ token: 'valid-token' }))}`;
    const req = { headers: makeHeadersWithFailingAuthorization(cookie) } as IncomingMessage;

    expect(() => authenticateSocket({} as never, req, next)).not.toThrow();
    expect(next).toHaveBeenCalledOnce();
  });

  it('authenticates API requests with a bearer token', () => {
    const { authenticate } = makeAuthenticateMiddleware('');
    const req = {
      cookies: {},
      headers: { authorization: 'Bearer valid-token' },
      query: {},
    } as unknown as Request;
    const res = makeResponse();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('accepts case-insensitive bearer schemes and extra whitespace', () => {
    const { authenticate } = makeAuthenticateMiddleware('');
    const req = {
      cookies: {},
      headers: { authorization: 'bearer   valid-token ' },
      query: {},
    } as unknown as Request;

    authenticate(req, makeResponse(), next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('authenticates redirecting routes with a bearer token', () => {
    const { authenticateAndRedirect } = makeAuthenticateMiddleware('/stage');
    const req = {
      cookies: {},
      headers: { authorization: 'Bearer valid-token' },
      originalUrl: '/stage/external/image.png',
      query: {},
    } as unknown as Request;
    const res = makeResponse();

    authenticateAndRedirect(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('authenticates WebSocket handshakes with a bearer token', () => {
    const req = {
      headers: { authorization: 'Bearer valid-token' },
    } as IncomingMessage;

    authenticateSocket({} as never, req, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects an invalid bearer token', () => {
    const { authenticate, authenticateAndRedirect } = makeAuthenticateMiddleware('');
    const req = {
      cookies: {},
      headers: { authorization: 'Bearer invalid-token' },
      query: {},
    } as unknown as Request;
    const res = makeResponse();

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Unauthorized');

    const redirectReq = { ...req, originalUrl: '/external/image.png' } as Request;
    const redirectRes = makeResponse();
    authenticateAndRedirect(redirectReq, redirectRes, next);

    expect(next).not.toHaveBeenCalled();
    expect(redirectRes.redirect).toHaveBeenCalledWith('/login?redirect=/external/image.png');

    const socketNext = vi.fn();
    authenticateSocket(
      {} as never,
      { headers: { authorization: 'Bearer invalid-token' } } as IncomingMessage,
      socketNext,
    );

    expect(socketNext).toHaveBeenCalledOnce();
    expect(socketNext.mock.calls[0][0]).toEqual(new Error('Unauthorized'));
  });

  it.each(['/socket?not_token=valid-token', '/socket?token=valid-token-suffix'])(
    'rejects lookalike WebSocket query tokens in %s',
    (url) => {
      const socketNext = vi.fn();

      authenticateSocket({} as never, { headers: { host: 'localhost' }, url } as IncomingMessage, socketNext);

      expect(socketNext).toHaveBeenCalledOnce();
      expect(socketNext.mock.calls[0][0]).toEqual(new Error('Unauthorized'));
    },
  );
});
