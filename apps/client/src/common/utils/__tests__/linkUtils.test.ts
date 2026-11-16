import { hostToBaseUrl, isLoopbackAddress, linkToOtherHost, mergeSearch, resolveRequestedLocation } from '../linkUtils';

describe('linkToOTherHost', () => {
  it('should handle electron links', () => {
    const serverUrl = 'http://localhost:4001';
    const baseUri = '';
    const destination = linkToOtherHost('192.168.10.166', 'path', serverUrl, baseUri);
    expect(destination).toBe('http://192.168.10.166:4001/path');
  });

  it('should handle ontime cloud links', () => {
    const serverUrl = 'https://cloud.getontime.no/user-hash';
    const baseUri = 'user-hash';
    const destination = linkToOtherHost('cloud.getontime.no', 'path', serverUrl, baseUri);
    expect(destination).toBe('https://cloud.getontime.no/user-hash/path');
  });

  it('should handle ontime app links', () => {
    const serverUrl = 'https://app.getontime.no/user-hash';
    const baseUri = 'user-hash';
    const destination = linkToOtherHost('app.getontime.no', 'path', serverUrl, baseUri);
    expect(destination).toBe('https://app.getontime.no/user-hash/path');
  });
});

describe('hostToBaseUrl', () => {
  it('uses http when the page is plain http', () => {
    expect(hostToBaseUrl('192.168.10.166', 4001, 'http://localhost:4001')).toBe('http://192.168.10.166:4001');
  });

  it('keeps https when the page reaches the server over TLS on the same port', () => {
    expect(hostToBaseUrl('192.168.10.166', 4001, 'https://localhost:4001')).toBe('https://192.168.10.166:4001');
  });

  it('falls back to http when the page is https on a different port (TLS proxy)', () => {
    // the raw server port does not speak TLS, an https link to it would fail
    expect(hostToBaseUrl('192.168.10.166', 4001, 'https://ontime.example.com')).toBe('http://192.168.10.166:4001');
  });
});

describe('isLoopbackAddress()', () => {
  it.each(['localhost', 'LOCALHOST', '127.0.0.1', '127.1.2.3', '::1', '[::1]'])(
    'identifies %s as loopback',
    (address) => {
      expect(isLoopbackAddress(address)).toBe(true);
    },
  );

  it.each(['192.168.1.2', '10.0.0.1', '1.127.0.0', '127.0.0', 'example.com'])('does not match %s', (address) => {
    expect(isLoopbackAddress(address)).toBe(false);
  });
});

describe('mergeSearch', () => {
  it('keeps the params the link does not name', () => {
    expect(mergeSearch('?layout=planning', 'settings=manage__custom')).toBe('layout=planning&settings=manage__custom');
  });

  it('replaces the params the link names', () => {
    expect(mergeSearch('?layout=planning&settings=project', 'settings=automation')).toBe(
      'layout=planning&settings=automation',
    );
  });
});

describe('resolveRequestedLocation', () => {
  it('keeps the current params on the current page', () => {
    expect(
      resolveRequestedLocation('/editor?settings=project', { pathname: '/editor/', search: '?layout=planning' }),
    ).toEqual({ pathname: '/editor', search: 'layout=planning&settings=project' });
  });

  it('leaves the params of another page behind', () => {
    expect(
      resolveRequestedLocation('/editor?settings=project', { pathname: '/timer', search: '?showLeadingZeros=true' }),
    ).toEqual({
      pathname: '/editor',
      search: 'settings=project',
    });
  });
});
