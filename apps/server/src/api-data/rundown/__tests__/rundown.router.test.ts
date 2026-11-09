import express from 'express';

import { errorHandler } from '../../../middleware/errorHandler.js';
import { router } from '../rundown.router.js';
import { editEntry } from '../rundown.service.js';

vi.mock('../rundown.service.js', () => ({ editEntry: vi.fn() }));
vi.mock('../../../utils/console.js', () => ({ consoleError: vi.fn(), consoleSubdued: vi.fn() }));

it('leaves unexpected service errors to the central error handler', async () => {
  vi.mocked(editEntry).mockRejectedValue(new Error('private diagnostic'));

  const app = express();
  app.use(express.json());
  app.use('/rundowns', router);
  app.use(errorHandler);

  const server = await new Promise<ReturnType<typeof app.listen>>((resolve, reject) => {
    const listeningServer = app.listen(0, '127.0.0.1', (error) => {
      if (error) reject(error);
      else resolve(listeningServer);
    });
  });

  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected a local server address');

    const response = await fetch(`http://127.0.0.1:${address.port}/rundowns/default/entry`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'entry' }),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: 'Internal server error' });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
