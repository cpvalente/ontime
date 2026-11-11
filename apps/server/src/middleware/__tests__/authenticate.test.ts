import type { IncomingMessage } from 'node:http';

import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api-data/session/session.service.js', () => ({
  hasPassword: true,
  hashedPassword: 'valid-token',
}));

// identity hash so the plain password 'valid-token' matches the mocked hashedPassword
vi.mock('../../utils/hash.js', () => ({
  hashPassword: (password: string) => password,
}));

import {
  authenticateSocket,
  getSafeRedirect,
  isPublicAssetRequest,
  makeAuthenticateMiddleware,
  makeLoginRouter,
  refuseCrossSite,
} from '../authenticate.js';

function makeResponse() {
  return {
    clearCookie: vi.fn(),
    cookie: vi.fn(),
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
    expect(isPublicAssetRequest('/manifest.json', '')).toBe(true);
  });

  it('allows prefixed public assets in cloud deployments', () => {
    expect(isPublicAssetRequest('/stage-hash/manifest.json', '/stage-hash')).toBe(true);
    expect(isPublicAssetRequest('/stage-hash/ontime-logo.png?cache=1', '/stage-hash')).toBe(true);
  });

  it('allows the PWA install icons', () => {
    expect(isPublicAssetRequest('/ontime-logo-192.png', '')).toBe(true);
    expect(isPublicAssetRequest('/ontime-logo-512.png', '')).toBe(true);
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
    expect(redirectRes.redirect).toHaveBeenCalledWith('/login?redirect=%2Fexternal%2Fimage.png');

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

describe('getSafeRedirect()', () => {
  it.each([
    ['/editor', ''],
    ['/timer?foo=bar', ''],
    ['/stage-hash/', '/stage-hash'],
    ['/stage-hash/cuesheet?foo=bar', '/stage-hash'],
  ])('keeps the path %s', (redirect, prefix) => {
    expect(getSafeRedirect(redirect, prefix)).toBe(redirect);
  });

  it.each([
    undefined,
    '',
    'https://example.com',
    '//example.com',
    '/\\example.com',
    'javascript:alert(1)',
    'example.com',
  ])('falls back to the root for %j', (redirect) => {
    expect(getSafeRedirect(redirect, '')).toBe('/');
    expect(getSafeRedirect(redirect, '/stage-hash')).toBe('/stage-hash/');
  });

  it.each(['/editor', '/stage-hash-other/timer'])(
    'falls back to the prefix root for %s outside the prefix',
    (redirect) => {
      expect(getSafeRedirect(redirect, '/stage-hash')).toBe('/stage-hash/');
    },
  );
});

describe('makeLoginRouter()', () => {
  function getLoginHandler(prefix: string) {
    const router = makeLoginRouter(prefix);
    const layer = router.stack.find((layer) => layer.route?.path === '/');
    const handler = layer?.route?.stack[0]?.handle;
    if (!handler) {
      throw new Error('Login handler not found');
    }
    return handler as (req: Request, res: Response) => void;
  }

  it('sets the cookie and redirects for the right password', () => {
    const res = makeResponse();
    getLoginHandler('/stage-hash')(
      {
        body: { password: 'valid-token', redirect: '/stage-hash/cuesheet' },
      } as Request,
      res,
    );

    expect(res.cookie).toHaveBeenCalledWith('token', JSON.stringify({ token: 'valid-token', scope: 'rw' }), {
      httpOnly: false,
      secure: true,
      path: '/stage-hash',
      sameSite: 'none',
    });
    expect(res.redirect).toHaveBeenCalledWith('/stage-hash/cuesheet');
  });

  it('falls back to the prefix root for a redirect outside this server', () => {
    const res = makeResponse();
    getLoginHandler('/stage-hash')(
      {
        body: { password: 'valid-token', redirect: 'https://example.com' },
      } as Request,
      res,
    );

    expect(res.redirect).toHaveBeenCalledWith('/stage-hash/');
  });
});

it('keeps the query string of the requested view through the login redirect', () => {
  const originalUrl = '/stage-hash/timer?n=1&lock=true';
  const { authenticateAndRedirect } = makeAuthenticateMiddleware('/stage-hash');
  const res = makeResponse();
  authenticateAndRedirect(
    { cookies: {}, headers: {}, originalUrl, query: {} } as unknown as Request,
    res,
    vi.fn() as NextFunction,
  );

  const loginUrl = vi.mocked(res.redirect).mock.calls[0][0] as unknown as string;
  // the login page reads the value with URLSearchParams and posts it back for the login handler
  const redirect = new URL(loginUrl, 'http://localhost').searchParams.get('redirect');
  expect(getSafeRedirect(redirect, '/stage-hash')).toBe(originalUrl);
});

describe('authenticateSocket() from another site', () => {
  const next = vi.fn();

  beforeEach(() => {
    next.mockClear();
  });

  it('refuses a cross-site connection that relies on the cookie', () => {
    const req = {
      headers: {
        host: '192.168.1.10:4001',
        origin: 'https://evil.example',
        cookie: 'token=' + encodeURIComponent(JSON.stringify({ token: 'valid-token' })),
      },
      url: '/ws',
    } as unknown as IncomingMessage;

    authenticateSocket({} as never, req, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('accepts a cross-site connection, such as a sandboxed view, with a token in its URL', () => {
    const req = {
      headers: { host: '192.168.1.10:4001', origin: 'null' },
      url: '/ws?token=valid-token',
    } as unknown as IncomingMessage;

    authenticateSocket({} as never, req, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('refuses a cross-site connection with a wrong token', () => {
    const req = {
      headers: { host: '192.168.1.10:4001', origin: 'null' },
      url: '/ws?token=nope',
    } as unknown as IncomingMessage;

    authenticateSocket({} as never, req, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('accepts same-origin connections with a token, and clients without an Origin like Companion', () => {
    const req = {
      headers: { host: '192.168.1.10:4001' },
      url: '/ws?token=valid-token',
    } as unknown as IncomingMessage;

    authenticateSocket({} as never, req, next);

    expect(next).toHaveBeenCalledWith();
  });
});

describe('refuseCrossSite()', () => {
  function run(headers: Record<string, string>, query: Record<string, string> = {}) {
    const req = { headers, query } as unknown as Request;
    const res = makeResponse();
    const next = vi.fn();
    refuseCrossSite(req, res, next);
    return { res, next };
  }

  it('passes same-origin requests and typed URLs', () => {
    expect(run({ 'sec-fetch-site': 'same-origin' }).next).toHaveBeenCalled();
    expect(run({ 'sec-fetch-site': 'none' }).next).toHaveBeenCalled();
  });

  it('refuses a request from another site, such as an image pointing at /api/stop', () => {
    const { res, next } = run({ 'sec-fetch-site': 'cross-site' });
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('passes a cross-site request that carries the token itself', () => {
    expect(run({ 'sec-fetch-site': 'cross-site' }, { token: 'valid-token' }).next).toHaveBeenCalled();
    expect(run({ 'sec-fetch-site': 'cross-site', authorization: 'Bearer valid-token' }).next).toHaveBeenCalled();
    expect(run({ 'sec-fetch-site': 'cross-site' }, { token: 'nope' }).next).not.toHaveBeenCalled();
  });
});
