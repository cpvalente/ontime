import { ensureJsonExtension } from '../utils/ensureJsonExtension.js';

export const sanitizeProjectFilename = (req, res, next) => {
  const { filename, newFilename } = req.body;
  const { filename: projectName } = req.params;

  req.body.filename = ensureJsonExtension(filename);
  req.body.newFilename = ensureJsonExtension(newFilename);
  req.params.filename = ensureJsonExtension(projectName);

  next();
};
