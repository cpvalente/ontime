import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ hasPassword: false, isOntimeCloud: false }));

vi.mock('../../api-data/session/session.service.js', () => ({
  get hasPassword() {
    return state.hasPassword;
  },
  hashedPassword: undefined,
}));

vi.mock('../../setup/environment.js', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  get isOntimeCloud() {
    return state.isOntimeCloud;
  },
}));

vi.mock('node:os', () => ({
  hostname: () => 'Stage-PC.home',
}));

import { isAllowedHost, isCrossSite, refuseUnknownHost } from '../crossSite.js';

beforeEach(() => {
  state.hasPassword = false;
  state.isOntimeCloud = false;
});

describe('isCrossSite()', () => {
  it('trusts Sec-Fetch-Site when the browser sends it', () => {
    expect(isCrossSite({ 'sec-fetch-site': 'same-origin' })).toBe(false);
    expect(isCrossSite({ 'sec-fetch-site': 'none' })).toBe(false);
    expect(isCrossSite({ 'sec-fetch-site': 'cross-site' })).toBe(true);
  });

  it('treats same-site and unknown values as cross-site', () => {
    // for an IP address, same-site means another port on the same machine
    expect(isCrossSite({ 'sec-fetch-site': 'same-site' })).toBe(true);
    expect(isCrossSite({ 'sec-fetch-site': 'same-origin, cross-site' })).toBe(true);
  });

  it('allows requests without browser headers, like Companion or scripts', () => {
    expect(isCrossSite({ host: '192.168.1.10:4001' })).toBe(false);
  });

  it('falls back to comparing the Origin with the Host', () => {
    expect(isCrossSite({ origin: 'http://192.168.1.10:4001', host: '192.168.1.10:4001' })).toBe(false);
    expect(isCrossSite({ origin: 'http://localhost:4001', host: 'LOCALHOST:4001' })).toBe(false);
    expect(isCrossSite({ origin: 'http://192.168.1.10:8080', host: '192.168.1.10:4001' })).toBe(true);
    expect(isCrossSite({ origin: 'https://evil.example', host: '192.168.1.10:4001' })).toBe(true);
  });

  it('refuses opaque and malformed origins', () => {
    expect(isCrossSite({ origin: 'null', host: '192.168.1.10:4001' })).toBe(true);
    expect(isCrossSite({ origin: 'not a url', host: '192.168.1.10:4001' })).toBe(true);
  });

  it('compares with the forwarded host in Ontime Cloud', () => {
    state.isOntimeCloud = true;
    const headers = { origin: 'https://cloud.getontime.no', host: 'stage-1:4001' };
    expect(isCrossSite({ ...headers, 'x-forwarded-host': 'cloud.getontime.no' })).toBe(false);
    expect(isCrossSite({ ...headers, 'x-forwarded-host': 'other.example' })).toBe(true);
  });
});

describe('isAllowedHost()', () => {
  it.each([
    '192.168.1.10:4001',
    '10.0.0.5',
    '[::1]:4001',
    '[fe80::1]',
    'localhost:4001',
    'app.localhost',
    'nas:4001',
    'ontime',
    'stage-pc.local:4001',
    'stage-pc.lan',
    'stage-pc.home.arpa',
    'Stage-PC.home',
  ])('allows %s', (host) => {
    expect(isAllowedHost(host)).toBe(true);
  });

  it.each([
    undefined,
    '',
    'evil.example',
    'evil.example:4001',
    'localhost.evil.example',
    'stage-pc.evil.example',
    '[::1',
  ])('refuses %s', (host) => {
    expect(isAllowedHost(host)).toBe(false);
  });

  it('allows hosts the user lists', () => {
    expect(isAllowedHost('ontime.example.com:4001', new Set(['ontime.example.com']))).toBe(true);
    expect(isAllowedHost('other.example.com', new Set(['ontime.example.com']))).toBe(false);
  });

  it('allows any host when the user lists *', () => {
    expect(isAllowedHost('anything.example.com', new Set(['*']))).toBe(true);
  });
});

describe('refuseUnknownHost()', () => {
  function run(headers: Record<string, string>) {
    const req = { headers } as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), send: vi.fn() } as unknown as Response;
    const next = vi.fn() as NextFunction;
    refuseUnknownHost(req, res, next);
    return { res, next };
  }

  it('refuses a browser on a rebound domain when there is no password', () => {
    const { res, next } = run({ host: 'evil.example:4001', 'sec-fetch-site': 'same-origin' });
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('passes a browser on an address of this machine', () => {
    expect(run({ host: '192.168.1.10:4001', 'sec-fetch-site': 'same-origin' }).next).toHaveBeenCalled();
  });

  it('passes clients without browser headers whatever the host', () => {
    expect(run({ host: 'ontime.example.com:4001' }).next).toHaveBeenCalled();
  });

  it('leaves the host to the password check when there is one', () => {
    state.hasPassword = true;
    expect(run({ host: 'ontime.example.com', 'sec-fetch-site': 'same-origin' }).next).toHaveBeenCalled();
  });
});
