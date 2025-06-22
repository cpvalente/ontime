import express from 'express';
import type { Request, Response } from 'express';
import { uploadExcel } from './excel.middleware.js';
import { validateFileExists, validateImportMapOptions } from './excel.validation.js';
import { CustomFields, ErrorResponse, Rundown } from 'ontime-types';
import { generateRundownPreview, listWorksheets, saveExcelFile } from './excel.service.js';

export const router = express.Router();

router.post('/upload', uploadExcel, validateFileExists, async (req: Request, res: Response<never | ErrorResponse>) => {
  try {
    // file has been validated by middleware
    const filePath = (req.file as Express.Multer.File).path;
    await saveExcelFile(filePath);
    res.status(201).send();
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
});

router.get('/worksheets', (_req: Request, res: Response<string[] | ErrorResponse>) => {
  try {
    const names = listWorksheets();
    res.status(200).send(names);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
});

router.post(
  '/preview',
  validateImportMapOptions,
  (req: Request, res: Response<{ rundown: Rundown; customFields: CustomFields } | ErrorResponse>) => {
    try {
      const { options } = req.body;
      const data = generateRundownPreview(options);
      res.status(200).send(data);
    } catch (error) {
      res.status(500).send({ message: String(error) });
    }
  },
);
