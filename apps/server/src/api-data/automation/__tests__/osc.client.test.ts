const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('node:dgram', () => ({
  createSocket: vi.fn(() => ({ send })),
}));

import { emitOSC } from '../clients/osc.client.js';

describe('emitOSC()', () => {
  it('resolves runtime templates in the target host', () => {
    emitOSC(
      {
        type: 'osc',
        targetIP: '{{eventNow.custom.oscTarget}}',
        targetPort: 53000,
        address: '/cue/start',
        args: '',
      },
      {
        eventNow: { custom: { oscTarget: 'qlab' } },
      } as never,
    );

    expect(send).toHaveBeenCalledWith(expect.anything(), 0, expect.any(Number), 53000, 'qlab', expect.any(Function));
  });
});
