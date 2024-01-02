export const sanitizeProjectFilename = (req, res, next) => {
  const { projectFilename, newProjectFilename } = req.body;
  const { projectName } = req.params;

  if (projectFilename) {
    req.body.projectFilename = projectFilename.includes('.json') ? projectFilename : `${projectFilename}.json`;
  }

  if (newProjectFilename) {
    req.body.newProjectFilename = newProjectFilename.includes('.json')
      ? newProjectFilename
      : `${newProjectFilename}.json`;
  }

  if (projectName) {
    req.params.projectName = projectName.includes('.json') ? projectName : `${projectName}.json`;
  }

  next();
};
