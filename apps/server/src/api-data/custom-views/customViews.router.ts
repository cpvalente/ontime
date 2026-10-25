import express from 'express';
import type { Request, Response, Router } from 'express';
import { type CustomViewsListResponse, type MessageResponse } from 'ontime-types';

import { uploadCustomViewFile } from './customViews.middleware.js';
import {
  deleteCustomView,
  getCustomViewDownloadPath,
  listCustomViews,
  restoreDemoView,
  setCustomViewDisplayInNav,
  uploadCustomView,
} from './customViews.service.js';
import { validateCustomViewPatch, validateCustomViewSlugParam } from './customViews.validation.js';

export const router: Router = express.Router();

router.get('/', async (_req: Request, res: Response<CustomViewsListResponse>) => {
  const views = await listCustomViews();
  res.status(200).send({ views });
});

router.post('/restore-demo', async (_req: Request, res: Response<MessageResponse>) => {
  const slug = await restoreDemoView();
  res.status(201).send({ message: `Restored demo view "${slug}"` });
});

router.post(
  '/:slug/upload',
  validateCustomViewSlugParam,
  uploadCustomViewFile,
  async (req: Request, res: Response<MessageResponse>) => {
    await uploadCustomView(req.params.slug, req.file);
    res.status(201).send({ message: `Uploaded custom view "${req.params.slug}"` });
  },
);

router.get('/:slug/download', validateCustomViewSlugParam, async (req: Request, res: Response) => {
  const pathToFile = await getCustomViewDownloadPath(req.params.slug);
  // without a callback, express forwards failures to the error middleware and ignores aborted downloads
  res.download(pathToFile, `${req.params.slug}-index.html`);
});

router.patch('/:slug', validateCustomViewPatch, async (req: Request, res: Response<CustomViewsListResponse>) => {
  const views = await setCustomViewDisplayInNav(req.params.slug, req.body.displayInNav);
  res.status(200).send({ views });
});

router.delete('/:slug', validateCustomViewSlugParam, async (req: Request, res: Response<never>) => {
  await deleteCustomView(req.params.slug);
  res.status(204).send();
});
