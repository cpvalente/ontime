/**
 * This module encapsulates logic related to
 * Google Sheets
 */

import type { Request, Response } from 'express';
import { generateRundownPreview, listWorksheets, saveExcelFile } from './excel.service.js';
import { CustomFields, Rundown } from 'ontime-types';

export async function postExcel(req: Request, res: Response) {
  try {
    // file has been validated by middleware
    const filePath = (req.file as Express.Multer.File).path;
    await saveExcelFile(filePath);
    res.status(200).send();
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}

export async function getWorksheets(req: Request, res: Response) {
  try {
    const names = listWorksheets();
    res.status(200).send(names);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}

/**
 * parses an Excel spreadsheet
 * @returns parsed result
 */
export async function previewExcel(
  req: Request,
  res: Response<{ rundown: Rundown; customFields: CustomFields } | { message: string }>,
) {
  try {
    const { options } = req.body;
    const data = generateRundownPreview(options);
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}
