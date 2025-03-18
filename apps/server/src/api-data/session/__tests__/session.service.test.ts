import { generateAuthenticatedUrl } from '../session.service.js';

describe('generateAuthenticatedUrl()', () => {
  describe('for local IP addresses', () => {
    it('generates a link without locking or authentication', () => {
      const localhostNotLocked = generateAuthenticatedUrl('http://localhost:3000', 'timer', false, false);
      expect(localhostNotLocked.toString()).toBe('http://localhost:3000/timer');
    });

    it('generates a link with IP locking enabled', () => {
      const ipLocked = generateAuthenticatedUrl('http://192.168.10.173:4001', 'timer', true, false);
      expect(ipLocked.toString()).toBe('http://192.168.10.173:4001/timer?locked=true');
    });

    it('generates a link with authentication token and IP locking', () => {
      const withAuth = generateAuthenticatedUrl('http://192.168.10.173:4001', 'timer', true, true, undefined, '1234');
      expect(withAuth.toString()).toBe('http://192.168.10.173:4001/timer?token=1234&locked=true');
    });
  });

  describe('for ontime-cloud URLs', () => {
    it('generates a link without locking or authentication', () => {
      const cloudNotLocked = generateAuthenticatedUrl(
        'https://cloud.getontime.no/userhash',
        'timer',
        false,
        false,
        'prefix',
      );
      expect(cloudNotLocked.toString()).toBe('https://cloud.getontime.no/prefix/timer');
    });

    it('generates a link with IP locking enabled', () => {
      const ipLocked = generateAuthenticatedUrl('https://cloud.getontime.no/prefix', 'timer', true, false, 'prefix');
      expect(ipLocked.toString()).toBe('https://cloud.getontime.no/prefix/timer?locked=true');
    });

    it('generates a link with authentication token and IP locking', () => {
      const withAuth = generateAuthenticatedUrl(
        'https://cloud.getontime.no/prefix',
        'timer',
        true,
        true,
        'prefix',
        '1234',
      );
      expect(withAuth.toString()).toBe('https://cloud.getontime.no/prefix/timer?token=1234&locked=true');
    });
  });
});
