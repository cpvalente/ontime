import * as dgram from 'node:dgram';

import { oscServer } from '../OscAdapter.js';

const isOntimeCloud = vi.hoisted(() => ({ value: false }));

vi.mock('../../setup/environment.js', () => ({
  isTest: true,
  environment: 'test',
  isDocker: false,
  isProduction: false,
  envPort: undefined,
  get isOntimeCloud() {
    return isOntimeCloud.value;
  },
}));

vi.mock('node:dgram', () => ({ createSocket: vi.fn() }));

vi.mock('../../classes/Logger.js', () => ({
  logger: { info: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

describe('oscServer.init()', () => {
  const socket = { on: vi.fn(), bind: vi.fn(), close: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dgram.createSocket).mockReturnValue(socket as unknown as dgram.Socket);
  });

  it('binds a socket when running outside of cloud', () => {
    isOntimeCloud.value = false;

    oscServer.init(8888);

    expect(socket.bind).toHaveBeenCalledWith(8888);
  });

  it('does not open a UDP socket in cloud environments', () => {
    isOntimeCloud.value = true;

    oscServer.init(8888);

    expect(dgram.createSocket).not.toHaveBeenCalled();
    expect(socket.bind).not.toHaveBeenCalled();
  });
});
