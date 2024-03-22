/**
 * This module encapsulates logic related to
 * Google Sheets
 */

import { Request, Response } from 'express';
import { extname, join } from 'path';
import { existsSync, renameSync } from 'fs';
import { generateId } from 'ontime-utils';
import { uploadsFolderPath } from '../../setup/index.js';
import { getExcelWorksheets, handleMaybeExcel } from '../../utils/parser.js';

export async function postExcel(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).send({ message: 'File not found' });
    return;
  }

  try {
    const filePath = req.file.path;
    if (!existsSync(filePath)) {
      throw new Error('Upload failed');
    }
    //TODO: clean up files somewhere
    const ext = extname(filePath);
    const newName = generateId() + ext;
    const newPath = join(uploadsFolderPath, newName);
    renameSync(filePath, newPath);

    res.status(200).send(newName);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}

export async function getWorksheets(req: Request, res: Response) {
  try {
    const fileId = req.params.fileId;
    const filePath = join(uploadsFolderPath, fileId);
    if (!existsSync(filePath)) {
      throw new Error('file missing');
    }
    const names = getExcelWorksheets(filePath);
    res.status(200).send(names);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}

/**
 * uploads and parses an Excel spreadsheet
 * @returns parsed result
 */
export async function previewExcel(req: Request, res: Response) {
  try {
    const fileId = req.params.fileId;
    const filePath = join(uploadsFolderPath, fileId);
    if (!existsSync(filePath)) {
      throw new Error('file missing');
    }
    const { options } = req.body;
    const { data } = handleMaybeExcel(filePath, options);
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}
