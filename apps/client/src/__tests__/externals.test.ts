// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

/** externals resolve on import, so each case sets up the document and imports a fresh copy */
async function loadExternals(baseHref?: string) {
  document.head.querySelector('base')?.remove();
  if (baseHref !== undefined) {
    const base = document.createElement('base');
    base.setAttribute('href', baseHref);
    document.head.appendChild(base);
  }
  vi.resetModules();
  return import('../externals');
}

describe('deployment URLs', () => {
  afterEach(() => {
    document.head.querySelector('base')?.remove();
  });

  it('targets the origin root when served without a prefix', async () => {
    const { baseURI, serverURL, websocketUrl } = await loadExternals();
    const { host } = window.location;

    expect(baseURI).toBe('');
    expect(serverURL).toBe(`http://${host}`);
    expect(websocketUrl).toBe(`ws://${host}/ws`);
  });

  it('keeps the runtime prefix when served below a path, as in Ontime Cloud', async () => {
    const { baseURI, serverURL, websocketUrl } = await loadExternals('/client-hash/');
    const { host } = window.location;

    expect(baseURI).toBe('/client-hash');
    expect(serverURL).toBe(`http://${host}/client-hash`);
    expect(websocketUrl).toBe(`ws://${host}/client-hash/ws`);
  });
});
