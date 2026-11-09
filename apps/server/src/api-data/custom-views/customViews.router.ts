import express from 'express';
import type { Request, Response, Router } from 'express';
import { type CustomViewsListResponse, type MessageResponse } from 'ontime-types';

import { uploadCustomViewFile } from './customViews.middleware.js';
import {
  deleteCustomView,
  getCustomViewDownloadPath,
  listCustomViews,
  restoreDemoView,
  uploadCustomView,
} from './customViews.service.js';
import { validateCustomViewSlugParam } from './customViews.validation.js';

export const router: Router = express.Router();

router.get('/', async (_req: Request, res: Response<CustomViewsListResponse>) => {
  const views = await listCustomViews();
  res.status(200).send({ views });
});

router.post('/restore-demo', async (_req: Request, res: Response<MessageResponse>) => {
  const view = await restoreDemoView();
  res.status(201).send({ message: `Restored demo view "${view.slug}"` });
});

router.post(
  '/:slug/upload',
  validateCustomViewSlugParam,
  uploadCustomViewFile,
  async (req: Request, res: Response<MessageResponse>) => {
    const view = await uploadCustomView(req.params.slug, req.file);
    res.status(201).send({ message: `Uploaded custom view "${view.slug}"` });
  },
);

router.get('/:slug/download', validateCustomViewSlugParam, async (req: Request, res: Response) => {
  const pathToFile = await getCustomViewDownloadPath(req.params.slug);
  // without a callback, express forwards failures to the error middleware and ignores aborted downloads
  res.download(pathToFile, `${req.params.slug}-index.html`);
});

router.delete('/:slug', validateCustomViewSlugParam, async (req: Request, res: Response<never>) => {
  await deleteCustomView(req.params.slug);
  res.status(204).send();
});
