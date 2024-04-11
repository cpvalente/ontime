/**
 * This module encapsulates logic related to
 * Excel import
 */

import { Request, Response } from 'express';
import type { CustomFields, ErrorResponse, OntimeRundown } from 'ontime-types';
import { generateRundownPreview, listWorksheets, saveExcelFile } from './excel.service.js';

export async function postExcel(req: Request, res: Response) {
  try {
    const filePath = req.file.path;
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
  res: Response<
    | {
        rundown: OntimeRundown;
        customFields: CustomFields;
      }
    | ErrorResponse
  >,
) {
  try {
    const { options, link } = req.body;
    const data = generateRundownPreview(options, link);
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}
