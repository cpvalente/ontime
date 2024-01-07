import { FastifyRouter } from './router.types.js';

import { uploadFile } from '../utils/upload.js';
import {
  dbDownload,
  dbUpload,
  getAliases,
  getInfo,
  getOSC,
  getHTTP,
  getSettings,
  getUserFields,
  getViewSettings,
  patchPartialProjectFile,
  poll,
  postAliases,
  postNew,
  postOSC,
  postOscSubscriptions,
  postSettings,
  postUserFields,
  postViewSettings,
  previewExcel,
  postHTTP,
  listProjects,
  loadProject,
} from '../controllers/ontimeController.js';
import { projectInfoSchema } from '../controllers/projectController.schema.js';
import {
  aliasesSchema,
  httpSchema,
  oscSchema,
  oscSubscriptionSchema,
  projectPartialSchema,
  settingsSchema,
  userFieldsSchema,
  viewSchema,
  loadProjectFileSchema,
} from '../controllers/ontimeController.schema.js';

export const router = (fastify: FastifyRouter, _opts, done) => {
  // create route between controller and '/ontime/sync' endpoint
  fastify.get('/poll', poll);

  // create route between controller and '/ontime/db' endpoint
  fastify.get('/db', dbDownload);

  // create route between controller and '/ontime/db' endpoint
  fastify.post('/db', { preHandler: uploadFile }, dbUpload);

  // create route between controller and '/ontime/excel' endpoint
  fastify.patch('/db', { schema: projectPartialSchema }, patchPartialProjectFile);

  // create route between controller and '/ontime/preview-spreadsheet' endpoint
  fastify.post('/preview-spreadsheet', { preHandler: uploadFile }, previewExcel);

  // create route between controller and '/ontime/settings' endpoint
  fastify.get('/settings', getSettings);

  // create route between controller and '/ontime/settings' endpoint
  fastify.post('/settings', { schema: settingsSchema }, postSettings);

  // create route between controller and '/ontime/views' endpoint
  fastify.get('/views', getViewSettings);

  // create route between controller and '/ontime/views' endpoint
  fastify.post('/views', { schema: viewSchema }, postViewSettings);

  // create route between controller and '/ontime/aliases' endpoint
  fastify.get('/aliases', getAliases);

  // create route between controller and '/ontime/aliases' endpoint
  fastify.post('/aliases', { schema: aliasesSchema }, postAliases);

  // create route between controller and '/ontime/aliases' endpoint
  fastify.get('/userfields', getUserFields);

  // create route between controller and '/ontime/aliases' endpoint
  fastify.post('/userfields', { schema: userFieldsSchema }, postUserFields);

  // create route between controller and '/ontime/info' endpoint
  fastify.get('/info', getInfo);

  // create route between controller and '/ontime/osc' endpoint
  fastify.get('/osc', getOSC);

  // create route between controller and '/ontime/osc' endpoint
  fastify.post('/osc', { schema: oscSchema }, postOSC);

  // create route between controller and '/ontime/osc-subscriptions' endpoint
  fastify.post('/osc-subscriptions', { schema: oscSubscriptionSchema }, postOscSubscriptions);

  // create route between controller and '/ontime/http' endpoint
  fastify.get('/http', getHTTP);

  // create route between controller and '/ontime/http' endpoint
  fastify.post('/http', { schema: httpSchema }, postHTTP);

  // create route between controller and '/ontime/new' endpoint
  fastify.post('/new', { schema: projectInfoSchema }, postNew);

  // create route between controller and '/ontime/projects' endpoint
  fastify.get('/projects', listProjects);

  // create route between controller and '/ontime/load-project' endpoint
  fastify.post('/load-project', { schema: loadProjectFileSchema }, loadProject);

  done();
};
