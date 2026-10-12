import express from 'express';
import type { Request, Response, Router } from 'express';
import type { ErrorResponse, Log } from 'ontime-types';

import { config } from '../../setup/config.js';
import { publicFiles } from '../../setup/index.js';
import { readLogEntries } from './logs.dao.js';

export const router: Router = express.Router();

/** sends a session log as a file, the paths are fixed so no request can reach another file */
function sendLog(path: string, filename: string, res: Response<ErrorResponse>) {
  // the data folder may be hidden, eg: ~/.Ontime
  res.download(path, filename, { dotfiles: 'allow' }, (error) => {
    if (error && !res.headersSent) {
      res.status(404).send({ message: 'Log not found' });
    }
  });
}

router.get('/entries', (_req: Request, res: Response<Log[]>) => {
  res.status(200).send(readLogEntries(publicFiles.logFile));
});

router.get('/current', (_req: Request, res: Response<ErrorResponse>) => {
  sendLog(publicFiles.logFile, config.logs.filename, res);
});

router.get('/previous', (_req: Request, res: Response<ErrorResponse>) => {
  sendLog(publicFiles.previousLogFile, config.logs.previous, res);
});
