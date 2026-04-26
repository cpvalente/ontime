import express from 'express';
import type { Request, Response, Router } from 'express';
import { type CustomViewsListResponse, type ErrorResponse, type MessageResponse } from 'ontime-types';

import { handleCustomViewsError } from './customViews.errors.js';
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

router.get('/', async (_req: Request, res: Response<CustomViewsListResponse | ErrorResponse>) => {
  try {
    const views = await listCustomViews();
    res.status(200).send({ views });
  } catch (error) {
    handleCustomViewsError(error, res);
  }
});

router.post('/restore-demo', async (_req: Request, res: Response<MessageResponse | ErrorResponse>) => {
  try {
    const view = await restoreDemoView();
    res.status(201).send({ message: `Restored demo view "${view.slug}"` });
  } catch (error) {
    handleCustomViewsError(error, res);
  }
});

router.post(
  '/:slug/upload',
  validateCustomViewSlugParam,
  uploadCustomViewFile,
  async (req: Request, res: Response<MessageResponse | ErrorResponse>) => {
    try {
      const view = await uploadCustomView(req.params.slug, req.file);
      res.status(201).send({ message: `Uploaded custom view "${view.slug}"` });
    } catch (error) {
      handleCustomViewsError(error, res);
    }
  },
);

router.get('/:slug/download', validateCustomViewSlugParam, async (req: Request, res: Response<ErrorResponse>) => {
  try {
    const pathToFile = await getCustomViewDownloadPath(req.params.slug);
    const fileName = `${req.params.slug}-index.html`;

    res.download(pathToFile, fileName, (error: Error | null) => {
      if (error && !res.headersSent) {
        res.status(500).send({ message: 'Could not download custom view' });
      }
    });
  } catch (error) {
    handleCustomViewsError(error, res);
  }
});

router.delete('/:slug', validateCustomViewSlugParam, async (req: Request, res: Response<ErrorResponse>) => {
  try {
    await deleteCustomView(req.params.slug);
    res.status(204).send();
  } catch (error) {
    handleCustomViewsError(error, res);
  }
});
