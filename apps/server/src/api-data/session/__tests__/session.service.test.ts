import { generateAuthenticatedUrl } from '../session.service.js';

describe('generateAuthenticatedUrl()', () => {
  describe('for local IP addresses', () => {
    it('generates a link without locking or authentication', () => {
      const localhostNotLocked = generateAuthenticatedUrl('http://localhost:3000', 'timer', {
        lockNav: false,
        authenticate: false,
      });
      expect(localhostNotLocked.toString()).toBe('http://localhost:3000/timer');
    });

    it('generates a link with navigation locking enabled', () => {
      const ipLocked = generateAuthenticatedUrl('http://192.168.10.173:4001', 'timer', {
        lockNav: true,
        authenticate: false,
      });
      expect(ipLocked.toString()).toBe('http://192.168.10.173:4001/timer?locked=true');
    });

    it('generates a link with authentication token and navigation locking', () => {
      const withAuth = generateAuthenticatedUrl('http://192.168.10.173:4001', 'timer', {
        lockNav: true,
        authenticate: true,
        hash: '1234',
      });
      expect(withAuth.toString()).toBe('http://192.168.10.173:4001/timer?token=1234&locked=true');
    });

    it('generates a link to a locked preset', () => {
      const withAuth = generateAuthenticatedUrl('http://192.168.10.173:4001', 'timer', {
        lockNav: true,
        authenticate: false,
        preset: 'minimal',
      });
      expect(withAuth.toString()).toBe('http://192.168.10.173:4001/preset/minimal?locked=true');
    });

    it('generates a link to an unlocked preset', () => {
      const withAuth = generateAuthenticatedUrl('http://192.168.10.173:4001', 'timer', {
        lockNav: false,
        authenticate: false,
        preset: 'minimal',
      });
      expect(withAuth.toString()).toBe('http://192.168.10.173:4001/timer?alias=minimal');
    });
  });

  describe('for ontime-cloud URLs', () => {
    it('generates a link without locking or authentication', () => {
      const cloudNotLocked = generateAuthenticatedUrl('https://cloud.getontime.no/userhash', 'timer', {
        lockNav: false,
        authenticate: false,
        prefix: 'prefix',
      });
      expect(cloudNotLocked.toString()).toBe('https://cloud.getontime.no/prefix/timer');
    });

    it('generates a link with navigation locking enabled', () => {
      const ipLocked = generateAuthenticatedUrl('https://cloud.getontime.no/prefix', 'timer', {
        lockNav: true,
        authenticate: false,
        prefix: 'prefix',
      });
      expect(ipLocked.toString()).toBe('https://cloud.getontime.no/prefix/timer?locked=true');
    });

    it('generates a link with authentication token and navigation locking', () => {
      const withAuth = generateAuthenticatedUrl('https://cloud.getontime.no/prefix', 'timer', {
        lockNav: true,
        authenticate: true,
        prefix: 'prefix',
        hash: '1234',
      });
      expect(withAuth.toString()).toBe('https://cloud.getontime.no/prefix/timer?token=1234&locked=true');
    });

    it('generates a link to a locked preset', () => {
      const withAuth = generateAuthenticatedUrl('https://cloud.getontime.no/prefix', 'timer', {
        lockNav: true,
        authenticate: false,
        prefix: 'prefix',
        preset: 'minimal',
      });
      expect(withAuth.toString()).toBe('https://cloud.getontime.no/prefix/preset/minimal?locked=true');
    });

    it('generates a link to an unlocked preset', () => {
      const withAuth = generateAuthenticatedUrl('https://cloud.getontime.no/prefix', 'timer', {
        lockNav: false,
        authenticate: false,
        prefix: 'prefix',
        preset: 'minimal',
      });
      expect(withAuth.toString()).toBe('https://cloud.getontime.no/prefix/timer?alias=minimal');
    });
  });
});
