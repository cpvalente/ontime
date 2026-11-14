import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../api-data/session/session.service.js', () => ({
  hasPassword: true,
  hashedPassword: 'password-hash',
  hashedReadPassword: 'read-hash',
}));

import { Access, type AccessScope, getTokenScope, scopedAccess } from '../access.js';

describe('getTokenScope()', () => {
  it('gives write to the hash of the session password', () => {
    expect(getTokenScope('password-hash')).toBe(Access.write);
    expect(getTokenScope('password-hash-suffix')).toBeUndefined();
  });

  it('gives read to the hash of the read password', () => {
    expect(getTokenScope('read-hash')).toBe(Access.read);
    expect(getTokenScope('read-hash-suffix')).toBeUndefined();
  });

  it.each([undefined, '', 'x'])('refuses %s', (token) => {
    expect(getTokenScope(token)).toBeUndefined();
  });
});

describe('scopedAccess()', () => {
  function run(required: AccessScope, scope: AccessScope | undefined, method = 'GET') {
    const req = { method } as Request;
    const res = { locals: { scope }, status: vi.fn().mockReturnThis(), send: vi.fn() } as unknown as Response;
    const next = vi.fn() as NextFunction;
    scopedAccess(required)(req, res, next);
    return { res, next };
  }

  it('write only lets write through', () => {
    expect(run(Access.write, Access.write).next).toHaveBeenCalled();
    const { res, next } = run(Access.write, Access.read);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('read lets read get, but not change', () => {
    expect(run(Access.read, Access.read, 'GET').next).toHaveBeenCalled();
    expect(run(Access.read, Access.read, 'HEAD').next).toHaveBeenCalled();
    expect(run(Access.read, Access.read, 'POST').next).not.toHaveBeenCalled();
    expect(run(Access.read, Access.write, 'DELETE').next).toHaveBeenCalled();
  });

  it('refuses a request without a scope', () => {
    expect(run(Access.read, undefined).next).not.toHaveBeenCalled();
  });
});
