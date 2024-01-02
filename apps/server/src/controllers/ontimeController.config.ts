import { ensureJsonExtension } from "../utils/ensureJsonExtension.js";

export const sanitizeProjectFilename = (req, res, next) => {
  const { projectFilename, newProjectFilename } = req.body;
  const { projectName } = req.params;

  req.body.projectFilename = ensureJsonExtension(projectFilename);
  req.body.newProjectFilename = ensureJsonExtension(newProjectFilename);
  req.params.projectName = ensureJsonExtension(projectName);

  next();
};