import { runtimeStorePlaceholder } from 'ontime-types';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('node:dgram', () => ({
  createSocket: vi.fn(() => ({ send })),
}));

import { emitOSC } from '../clients/osc.client.js';

describe('emitOSC()', () => {
  beforeEach(() => {
    send.mockClear();
  });

  it('resolves templates in the target host before sending', () => {
    emitOSC(
      {
        type: 'osc',
        targetIP: '{{eventNow.custom.oscTarget}}',
        targetPort: 53000,
        address: '/cue/start',
        args: '',
      },
      {
        ...runtimeStorePlaceholder,
        eventNow: {
          id: 'current-event',
          type: 'event',
          cue: '1',
          title: 'Opening',
          note: '',
          timeStart: 0,
          timeEnd: 0,
          duration: 0,
          timerType: 'count-down',
          colour: '',
          delay: 0,
          isPublic: true,
          skip: false,
          endAction: 'none',
          revision: 0,
          custom: { oscTarget: '192.0.2.10' },
        },
      },
    );

    expect(send).toHaveBeenCalledWith(
      expect.anything(),
      0,
      expect.any(Number),
      53000,
      '192.0.2.10',
      expect.any(Function),
    );
  });
});
