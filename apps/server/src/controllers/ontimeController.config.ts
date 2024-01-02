import { ensureJsonExtension } from "../utils/ensureJsonExtension.js";

export const sanitizeProjectFilename = (req, res, next) => {
  const { projectFilename, newProjectFilename } = req.body;
  const { projectName } = req.params;

  if (projectFilename) {
    req.body.projectFilename = ensureJsonExtension(projectFilename);
  }

  if (newProjectFilename) {
    req.body.newProjectFilename = ensureJsonExtension(newProjectFilename);
  }

  if (projectName) {
    req.params.projectName = ensureJsonExtension(projectName);
  }

  next();
};