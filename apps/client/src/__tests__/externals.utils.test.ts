import { describe, expect, it } from 'vitest';

import { resolveBaseURI, resolveUrl } from '../externals.utils';

describe('resolveBaseURI()', () => {
  it('resolves an empty base when served from the root', () => {
    expect(resolveBaseURI('/')).toBe('');
    expect(resolveBaseURI(null)).toBe('');
  });

  it('keeps the runtime prefix when served below a path, as in Ontime Cloud', () => {
    expect(resolveBaseURI('/client-hash/')).toBe('/client-hash');
  });
});

describe('resolveUrl()', () => {
  const local = { origin: 'http://localhost:4001', protocol: 'http:' };
  const cloud = { origin: 'https://cloud.getontime.no', protocol: 'https:' };

  it('targets the server at the origin root', () => {
    expect(resolveUrl(local, '', 'http', '')).toBe('http://localhost:4001');
    expect(resolveUrl(local, '', 'ws', 'ws')).toBe('ws://localhost:4001/ws');
  });

  it('targets the server below the runtime prefix', () => {
    expect(resolveUrl(cloud, '/client-hash', 'http', '')).toBe('https://cloud.getontime.no/client-hash');
    expect(resolveUrl(cloud, '/client-hash', 'ws', 'ws')).toBe('wss://cloud.getontime.no/client-hash/ws');
  });

  it('uses a secure websocket when the page is served over https', () => {
    expect(resolveUrl(cloud, '', 'ws', 'ws')).toBe('wss://cloud.getontime.no/ws');
  });
});
