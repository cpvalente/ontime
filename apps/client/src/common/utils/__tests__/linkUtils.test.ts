import { hostToBaseUrl, linkToOtherHost } from '../linkUtils';

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
