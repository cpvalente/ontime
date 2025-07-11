import express from 'express';
import type { Request, Response } from 'express';
import { ErrorResponse } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';
import { readUserTranslation, writeUserTranslation } from './translations.service.js';
import { validatePostTranslation } from './translations.validation.js';
import { TranslationObject } from './translations.type.js';

export const router = express.Router();

router.get('/', async (_req: Request, res: Response<TranslationObject | ErrorResponse>) => {
  try {
    const data = await readUserTranslation();
    res.status(200).send(data);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
});

router.post('/', validatePostTranslation, async (req: Request, res: Response<never | ErrorResponse>) => {
  const { translation } = req.body;
  try {
    await writeUserTranslation(translation);
    res.status(204).send();
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
});
