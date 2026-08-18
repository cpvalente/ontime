import { describe, expect, test } from 'vitest';

import { getExternalInterfaces } from '../otherAddresses.utils';

describe('getExternalInterfaces', () => {
  test('returns no alternatives when localhost is the only interface', () => {
    expect(getExternalInterfaces([{ name: 'localhost', address: '127.0.0.1' }])).toEqual([]);
  });

  test('does not treat an interface name as deployment information', () => {
    expect(
      getExternalInterfaces([
        { name: 'localhost', address: '127.0.0.1' },
        { name: 'cloud', address: '192.168.1.42' },
      ]),
    ).toEqual([{ name: 'cloud', address: '192.168.1.42' }]);
  });

  test('returns non-local interfaces when local and external interfaces are available', () => {
    expect(
      getExternalInterfaces([
        { name: 'localhost', address: '127.0.0.1' },
        { name: 'Wi-Fi', address: '192.168.1.42' },
        { name: 'Ethernet', address: '10.0.0.42' },
      ]),
    ).toEqual([
      { name: 'Wi-Fi', address: '192.168.1.42' },
      { name: 'Ethernet', address: '10.0.0.42' },
    ]);
  });
});
