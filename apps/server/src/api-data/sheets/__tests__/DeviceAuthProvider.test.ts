import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DeviceAuthProvider } from '../DeviceAuthProvider.js';

describe('DeviceAuthProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('should start with not_authenticated status', () => {
    const provider = new DeviceAuthProvider();
    expect(provider.getStatus()).toBe('not_authenticated');
  });

  it('should initiate authentication and poll', async () => {
    const provider = new DeviceAuthProvider();
    const mockClientSecret = {
      installed: {
        client_id: 'id',
        client_secret: 'secret',
        auth_uri: '',
        token_uri: '',
        auth_provider_x509_cert_url: '',
      },
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        device_code: 'dc',
        expires_in: 60,
        interval: 5,
        user_code: 'uc',
        verification_url: 'vurl',
      }),
    });

    const onAuth = vi.fn();
    const result = await provider.authenticate(mockClientSecret, onAuth);

    expect(result).toEqual({
      verification_url: 'vurl',
      user_code: 'uc',
    });
    expect(provider.getStatus()).toBe('pending');
    expect(fetch).toHaveBeenCalledTimes(1);

    // Poll 1: not yet authorized
    (fetch as any).mockResolvedValueOnce({
      status: 428,
      ok: false,
    });

    vi.advanceTimersByTime(5000);
    // Poll happens in background
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(provider.getStatus()).toBe('pending');

    // Poll 2: success
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'at',
        refresh_token: 'rt',
        scope: 'scope',
        token_type: 'Bearer',
      }),
    });

    vi.advanceTimersByTime(5000);
    await vi.waitFor(() => expect(onAuth).toHaveBeenCalled());
    expect(provider.getStatus()).toBe('authenticated');
  });

  it('should stop polling after expiration', async () => {
    const provider = new DeviceAuthProvider();
    const mockClientSecret = {
      installed: {
        client_id: 'id',
        client_secret: 'secret',
        auth_uri: '',
        token_uri: '',
        auth_provider_x509_cert_url: '',
      },
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        device_code: 'dc',
        expires_in: 10,
        interval: 5,
        user_code: 'uc',
        verification_url: 'vurl',
      }),
    });

    await provider.authenticate(mockClientSecret, vi.fn());
    expect(provider.getStatus()).toBe('pending');

    vi.advanceTimersByTime(11000);
    expect(provider.getStatus()).toBe('not_authenticated');
  });

  it('should reset on revoke', async () => {
    const provider = new DeviceAuthProvider();
    const mockClientSecret = {
      installed: {
        client_id: 'id',
        client_secret: 'secret',
        auth_uri: '',
        token_uri: '',
        auth_provider_x509_cert_url: '',
      },
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        device_code: 'dc',
        expires_in: 60,
        interval: 5,
        user_code: 'uc',
        verification_url: 'vurl',
      }),
    });

    await provider.authenticate(mockClientSecret, vi.fn());
    provider.revoke();
    expect(provider.getStatus()).toBe('not_authenticated');
    expect(provider.getAuthClient()).toBeNull();
  });
});
