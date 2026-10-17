import { findPrivateNetworkAddress, hostToBaseUrl, isLoopbackAddress, linkToOtherHost } from '../linkUtils';

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

describe('findPrivateNetworkAddress()', () => {
  it('returns the first private address, skipping loopback', () => {
    const interfaces = [
      { name: 'localhost', address: '127.0.0.1' },
      { name: 'eth0', address: '192.168.1.20' },
      { name: 'eth1', address: '10.0.0.5' },
    ];
    expect(findPrivateNetworkAddress(interfaces)).toBe('192.168.1.20');
  });

  it('recognises the private 172.16-31 range only', () => {
    expect(findPrivateNetworkAddress([{ name: 'a', address: '172.15.0.1' }])).toBeUndefined();
    expect(findPrivateNetworkAddress([{ name: 'a', address: '172.31.0.1' }])).toBe('172.31.0.1');
  });

  it('returns undefined when there is no private interface', () => {
    expect(findPrivateNetworkAddress([])).toBeUndefined();
    expect(findPrivateNetworkAddress([{ name: 'localhost', address: '127.0.0.1' }])).toBeUndefined();
    expect(findPrivateNetworkAddress([{ name: 'wan', address: '8.8.8.8' }])).toBeUndefined();
  });
});
