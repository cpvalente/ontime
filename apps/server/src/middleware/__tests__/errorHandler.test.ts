import express, { type Request, type Response } from 'express';
import { LogLevel, LogOrigin } from 'ontime-types';

import * as logger from '../../api-data/logs/logs.service.js';
import type { LogLine } from '../../api-data/logs/logs.utils.js';
import { errorHandler } from '../errorHandler.js';
import { ConflictError, InvalidInputError, NotFoundError } from '../errors.js';

vi.mock('../../utils/console.js', () => ({
  consoleError: vi.fn(),
  consoleSubdued: vi.fn(),
}));

afterEach(() => logger.shutdown());

it('hides unexpected route errors from clients and logs them', async () => {
  const entries: LogLine[] = [];
  logger.init({ append: (entry) => entries.push(entry) });

  const app = express();
  app.get('/failure', async () => {
    throw new Error('private diagnostic');
  });
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

    const response = await fetch(`http://127.0.0.1:${address.port}/failure`);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: 'Internal server error' });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ level: LogLevel.Error, origin: LogOrigin.Api });
    expect(entries[0].text).toContain('private diagnostic');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

it.each([
  { error: new NotFoundError('Preset missing'), status: 404 },
  { error: new ConflictError('Preset exists'), status: 409 },
  { error: new InvalidInputError('Preset invalid'), status: 422 },
])('answers $error.name with $status and its message', ({ error, status }) => {
  const res = { headersSent: false, status: vi.fn().mockReturnThis(), send: vi.fn() };

  errorHandler(error, {} as Request, res as unknown as Response, vi.fn());

  expect(res.status).toHaveBeenCalledWith(status);
  expect(res.send).toHaveBeenCalledWith({ message: error.message });
});
