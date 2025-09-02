import express from 'express';
import type { Request, Response } from 'express';
import type { ErrorResponse } from 'ontime-types';
import { validatePostCss, validatePostTranslation } from './assets.validation.js';
import { readCssFile, writeCssFile, writeUserTranslation } from './assets.service.js';
import { getErrorMessage } from 'ontime-utils';
import { defaultCss } from '../../user/styles/bundledCss.js';

export const router = express.Router();

router.get('/css', async (_req: Request, res: Response<string | ErrorResponse>) => {
  try {
    const data = await readCssFile();
    res.status(200).send(data);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
});

router.post('/css', validatePostCss, async (req: Request, res: Response<never | ErrorResponse>) => {
  const { css } = req.body;
  try {
    await writeCssFile(css);
    res.status(204).send();
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
});

router.post('/css/restore', async (_req: Request, res: Response<string | ErrorResponse>) => {
  try {
    await writeCssFile(defaultCss);
    res.status(200).send(defaultCss);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
});

router.post('/translations', validatePostTranslation, async (req: Request, res: Response<never | ErrorResponse>) => {
  const { translation } = req.body;

  if (!translation) {
    res.status(400).send({ message: 'translation payload is required ' });
    return;
  }

  try {
    await writeUserTranslation(translation);
    res.status(204).send();
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
});
