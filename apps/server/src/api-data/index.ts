import express from 'express';

import { router as aliasesRouter } from './aliases/aliases.router.js';
import { router as customFieldsRouter } from './custom-fields/customFields.router.js';
import { router as dbRouter } from './db/db.router.js';
import { router as httpRouter } from './http/http.router.js';
import { router as oscRouter } from './osc/osc.router.js';
import { router as projectRouter } from './project/project.router.js';
import { router as rundownRouter } from './rundown/rundown.router.js';
import { router as settingsRouter } from './settings/settings.router.js';
import { router as sheetsRouter } from './sheets/sheets.router.js';
import { router as viewSettingsRouter } from './view-settings/viewSettings.router.js';

export const appRouter = express.Router();

appRouter.use('/aliases', aliasesRouter);
appRouter.use('/custom-fields', customFieldsRouter);
appRouter.use('/db', dbRouter);
appRouter.use('/http', httpRouter);
appRouter.use('/osc', oscRouter);
appRouter.use('/project', projectRouter);
appRouter.use('/rundown', rundownRouter);
appRouter.use('/settings', settingsRouter);
appRouter.use('/sheets', sheetsRouter);
appRouter.use('/view-settings', viewSettingsRouter);
