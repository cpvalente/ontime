import { NextFunction, Request, Response } from 'express';
import { ensureJsonExtension } from './ensureJsonExtension.js';

export const sanitizeProjectFilename = (req: Request, _res: Response, next: NextFunction) => {
  const { filename, newFilename } = req.body;
  const { filename: projectName } = req.params;

  req.body.filename = ensureJsonExtension(filename);
  req.body.newFilename = ensureJsonExtension(newFilename);
  req.params.filename = ensureJsonExtension(projectName);

  next();
};
