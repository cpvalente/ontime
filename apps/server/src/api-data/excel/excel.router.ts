import express from 'express';
import type { Request, Response, Router } from 'express';
import type {
  SpreadsheetPreviewResponse,
  SpreadsheetWorksheetMetadata,
  SpreadsheetWorksheetOptions,
} from 'ontime-types';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { getProcessedRundown, getProjectCustomFields } from '../rundown/rundown.dao.js';
import { EXCEL_MIME } from './excel.constants.js';
import { uploadExcel } from './excel.middleware.js';
import {
  generateExcelFile,
  generateExcelWorkbook,
  generateRundownPreview,
  getWorksheetMetadata,
  readExcelFile,
} from './excel.service.js';
import {
  validateFileExists,
  validateImportMapOptions,
  validateRundownExport,
  validateWorksheetMetadataRequest,
} from './excel.validation.js';

export const router: Router = express.Router();

router.post(
  '/upload',
  uploadExcel,
  validateFileExists,
  async (req: Request, res: Response<SpreadsheetWorksheetOptions>) => {
    // file has been validated by middleware
    const filePath = (req.file as Express.Multer.File).path;
    const worksheetOptions = await readExcelFile(filePath);
    res.status(200).send(worksheetOptions);
  },
);

router.post('/preview', validateImportMapOptions, (req: Request, res: Response<SpreadsheetPreviewResponse>) => {
  const { options } = req.body;
  const data = generateRundownPreview(options);
  res.status(200).send(data);
});

router.post(
  '/metadata',
  validateWorksheetMetadataRequest,
  (req: Request, res: Response<SpreadsheetWorksheetMetadata>) => {
    const { worksheet } = req.body;
    const data = getWorksheetMetadata(worksheet);
    res.status(200).send(data);
  },
);

router.get('/export', (_req: Request, res: Response) => {
  const rundowns = Object.keys(getDataProvider().getProjectRundowns()).map(getProcessedRundown);
  const buffer = generateExcelWorkbook(rundowns, getProjectCustomFields());
  res.setHeader('Content-Disposition', 'attachment;');
  res.setHeader('Content-Type', EXCEL_MIME);
  res.setHeader('Content-Length', buffer.length.toString());
  res.status(200).send(buffer);
});

router.get('/:rundownId/export', validateRundownExport, (req: Request, res: Response) => {
  const rundown = getProcessedRundown(req.params.rundownId);
  const customFields = getProjectCustomFields();
  const buffer = generateExcelFile(rundown, customFields);

  res.setHeader('Content-Disposition', 'attachment;');
  res.setHeader('Content-Type', EXCEL_MIME);
  res.setHeader('Content-Length', buffer.length.toString());
  res.status(200).send(buffer);
});
