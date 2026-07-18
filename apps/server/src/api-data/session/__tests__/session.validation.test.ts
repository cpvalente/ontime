import { describe, expect, it } from 'vitest';

import { runMiddleware } from '../../validation-utils/__tests__/testMiddleware.js';
import { validateGenerateUrl } from '../session.validation.js';

describe('validateGenerateUrl', () => {
  it('accepts a valid payload and normalises req.body', () => {
    const { nextCalled, req } = runMiddleware(validateGenerateUrl, {
      body: {
        baseUrl: 'https://ontime.example',
        path: '/timer',
        authenticate: true,
        lockConfig: false,
        lockNav: false,
      },
    });
    expect(nextCalled).toBe(true);
    expect(req.body).toMatchObject({ baseUrl: 'https://ontime.example', path: '/timer' });
  });

  it('accepts an optional preset field', () => {
    const { nextCalled, req } = runMiddleware(validateGenerateUrl, {
      body: {
        baseUrl: 'https://ontime.example',
        path: '/timer',
        authenticate: true,
        lockConfig: false,
        lockNav: false,
        preset: 'my-preset',
      },
    });
    expect(nextCalled).toBe(true);
    expect(req.body.preset).toBe('my-preset');
  });

  it('rejects a missing required field with a 422', () => {
    const { nextCalled, statusCode } = runMiddleware(validateGenerateUrl, {
      body: { path: '/timer', authenticate: true, lockConfig: false, lockNav: false },
    });
    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(422);
  });

  it('rejects a wrong-typed field', () => {
    const { nextCalled, statusCode } = runMiddleware(validateGenerateUrl, {
      body: {
        baseUrl: 'https://ontime.example',
        path: '/timer',
        authenticate: 'yes', // should be boolean
        lockConfig: false,
        lockNav: false,
      },
    });
    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(422);
  });
});
