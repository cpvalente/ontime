import express from 'express';
import type { Request, Response } from 'express';
import { CustomFields, ErrorResponse, Rundown, RundownSummary } from 'ontime-types';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';

import { getProjectCustomFields } from '../rundown/rundown.dao.js';

import { uploadExcel } from './excel.middleware.js';
import { validateFileExists, validateImportMapOptions, validateRundownExport } from './excel.validation.js';
import { generateExcelFile, generateRundownPreview, readExcelFile } from './excel.service.js';
import { EXCEL_MIME } from './excel.constants.js';

export const router = express.Router();

router.post(
  '/upload',
  uploadExcel,
  validateFileExists,
  async (req: Request, res: Response<string[] | ErrorResponse>) => {
    try {
      // file has been validated by middleware
      const filePath = (req.file as Express.Multer.File).path;
      const worksheetNames = await readExcelFile(filePath);
      res.status(200).send(worksheetNames);
    } catch (error) {
      res.status(500).send({ message: String(error) });
    }
  },
);

router.post(
  '/preview',
  validateImportMapOptions,
  (
    req: Request,
    res: Response<{ rundown: Rundown; customFields: CustomFields; summary: RundownSummary } | ErrorResponse>,
  ) => {
    try {
      const { options } = req.body;
      const data = generateRundownPreview(options);
      res.status(200).send(data);
    } catch (error) {
      res.status(500).send({ message: String(error) });
    }
  },
);

router.get('/:rundownId/export', validateRundownExport, (req: Request, res: Response) => {
  try {
    const rundown = getDataProvider().getRundown(req.params.rundownId);
    const customFields = getProjectCustomFields();
    const buffer = generateExcelFile(rundown, customFields);

    res.setHeader('Content-Disposition', 'attachment;');
    res.setHeader('Content-Type', EXCEL_MIME);
    res.setHeader('Content-Length', buffer.length.toString());
    res.status(200).send(buffer);
  } catch (error) {
    res.status(500).send({ message: 'Failed to generate Excel file' });
  }
});
