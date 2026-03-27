import { describe, expect, it } from 'vitest';

import { isPublicAssetRequest } from '../authenticate.js';

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
