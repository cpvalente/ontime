import { generateShareUrl } from '../session.service.js';

describe('generateAuthenticatedUrl()', () => {
  describe('for local IP addresses', () => {
    it('generates a link without locking or authentication', () => {
      const localhostNotLocked = generateShareUrl('http://localhost:3000', 'timer', {
        lockConfig: false,
        lockNav: false,
        authenticate: false,
      });
      expect(localhostNotLocked.toString()).toBe('http://localhost:3000/timer');
    });

    it('generates a link with navigation locking enabled', () => {
      const ipLocked = generateShareUrl('http://192.168.10.173:4001', 'timer', {
        lockConfig: false,
        lockNav: true,
        authenticate: false,
      });
      expect(ipLocked.toString()).toBe('http://192.168.10.173:4001/timer?n=1');
    });

    it('generates a link with authentication token and navigation locking', () => {
      const withAuth = generateShareUrl('http://192.168.10.173:4001', 'timer', {
        lockConfig: false,
        lockNav: true,
        authenticate: true,
        hash: '1234',
      });
      expect(withAuth.toString()).toBe('http://192.168.10.173:4001/timer?n=1&token=1234');
    });

    it('generates a link to an unlocked preset', () => {
      const withAuth = generateShareUrl('http://192.168.10.173:4001', 'timer', {
        lockConfig: false,
        lockNav: false,
        authenticate: false,
        preset: 'minimal',
      });
      expect(withAuth.toString()).toBe('http://192.168.10.173:4001/minimal');
    });

    it('generates a link to an unlocked preset without navigation', () => {
      const withAuth = generateShareUrl('http://192.168.10.173:4001', 'timer', {
        lockConfig: false,
        lockNav: true,
        authenticate: false,
        preset: 'minimal',
      });
      expect(withAuth.toString()).toBe('http://192.168.10.173:4001/minimal?n=1');
    });

    it('generates a link to a locked preset', () => {
      const withAuth = generateShareUrl('http://192.168.10.173:4001', 'timer', {
        lockConfig: true,
        lockNav: false,
        authenticate: false,
        preset: 'minimal',
      });
      expect(withAuth.toString()).toBe('http://192.168.10.173:4001/preset/minimal');
    });

    it('generates a link to a locked preset', () => {
      const withAuth = generateShareUrl('http://192.168.10.173:4001', 'cuesheet', {
        lockConfig: false,
        lockNav: false,
        authenticate: false,
        preset: 'some-cuesheet-preset',
      });
      expect(withAuth.toString()).toBe('http://192.168.10.173:4001/preset/some-cuesheet-preset');
    });

    it('generates a link for companion', () => {
      const withAuth = generateShareUrl('http://192.168.10.173:4001', '<<companion>>', {
        lockConfig: false,
        lockNav: false,
        authenticate: true,
        preset: undefined,
        hash: '1234',
      });
      expect(withAuth.toString()).toBe('http://192.168.10.173:4001/?token=1234');
    });

    it('throws if provided an IP address without protocol', () => {
      expect(() =>
        generateShareUrl('192.168.10.173', '<<companion>>', {
          lockConfig: false,
          lockNav: false,
          authenticate: true,
          preset: undefined,
          hash: '1234',
        }),
      ).toThrowError('Invalid URL');
    });
  });

  describe('for ontime-cloud URLs', () => {
    it('generates a link without locking or authentication', () => {
      const cloudNotLocked = generateShareUrl('https://cloud.getontime.no/userhash', 'timer', {
        lockConfig: false,
        lockNav: false,
        authenticate: false,
        prefix: 'prefix',
      });
      expect(cloudNotLocked.toString()).toBe('https://cloud.getontime.no/prefix/timer');
    });

    it('generates a link with navigation locking enabled', () => {
      const ipLocked = generateShareUrl('https://cloud.getontime.no/prefix', 'timer', {
        lockConfig: false,
        lockNav: true,
        authenticate: false,
        prefix: 'prefix',
      });
      expect(ipLocked.toString()).toBe('https://cloud.getontime.no/prefix/timer?n=1');
    });

    it('generates a link with authentication token and navigation locking', () => {
      const withAuth = generateShareUrl('https://cloud.getontime.no/prefix', 'timer', {
        lockConfig: false,
        lockNav: true,
        authenticate: true,
        prefix: 'prefix',
        hash: '1234',
      });
      expect(withAuth.toString()).toBe('https://cloud.getontime.no/prefix/timer?n=1&token=1234');
    });

    it('generates a link to an unlocked preset', () => {
      const withAuth = generateShareUrl('https://cloud.getontime.no/prefix', 'timer', {
        lockConfig: false,
        lockNav: false,
        authenticate: false,
        preset: 'minimal',
        prefix: 'prefix',
      });
      expect(withAuth.toString()).toBe('https://cloud.getontime.no/prefix/minimal');
    });

    it('generates a link to an unlocked preset without navigation', () => {
      const withAuth = generateShareUrl('https://cloud.getontime.no/prefix', 'timer', {
        lockConfig: false,
        lockNav: true,
        authenticate: false,
        preset: 'minimal',
        prefix: 'prefix',
      });
      expect(withAuth.toString()).toBe('https://cloud.getontime.no/prefix/minimal?n=1');
    });

    it('generates a link to a locked preset', () => {
      const withAuth = generateShareUrl('https://cloud.getontime.no/prefix', 'timer', {
        lockConfig: true,
        lockNav: false,
        authenticate: false,
        prefix: 'prefix',
        preset: 'minimal',
      });
      expect(withAuth.toString()).toBe('https://cloud.getontime.no/prefix/preset/minimal');
    });

    it('generates a link to a locked preset', () => {
      const withAuth = generateShareUrl('https://cloud.getontime.no/prefix', 'cuesheet', {
        lockConfig: false,
        lockNav: false,
        authenticate: false,
        prefix: 'prefix',
        preset: 'some-cuesheet-preset',
      });
      expect(withAuth.toString()).toBe('https://cloud.getontime.no/prefix/preset/some-cuesheet-preset');
    });
  });
});
