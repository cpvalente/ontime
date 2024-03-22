/**
 * This module encapsulates logic related to
 * Google Sheets
 */

import { Request, Response } from 'express';
import { readFileSync } from 'fs';

import { deleteFile } from '../../utils/parserUtils.js';
import {
  revoke,
  handleClientSecret,
  handleInitialConnection,
  hasAuth,
  download,
  upload,
  getWorksheetOptions,
} from '../../services/sheet-service/SheetService.js';

export async function requestConnection(req: Request, res: Response) {
  const { sheetId } = req.params;
  const file = req.file.path;

  try {
    const client = readFileSync(file, 'utf-8');
    const clientSecret = handleClientSecret(client);
    const { verification_url, user_code } = await handleInitialConnection(clientSecret, sheetId);

    res.status(200).send({ verification_url, user_code });
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }

  // delete uploaded file after parsing
  try {
    deleteFile(file);
  } catch (_error) {
    /** we dont handle failure here */
  }
}

export async function verifyAuthentication(_req: Request, res: Response) {
  try {
    const authenticated = hasAuth();
    res.status(200).send(authenticated);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}

export async function revokeAuthentication(_req: Request, res: Response) {
  try {
    const authenticated = revoke();
    res.status(200).send(authenticated);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}

export async function getWorksheetNamesFromSheet(req: Request, res: Response) {
  try {
    const { sheetId } = req.params;
    const { worksheetOptions } = await getWorksheetOptions(sheetId);
    res.status(200).send(worksheetOptions);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}

export async function readFromSheet(req: Request, res: Response) {
  try {
    const { sheetId } = req.params;
    const { options } = req.body;
    const data = await download(sheetId, options);
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}

export async function writeToSheet(req: Request, res: Response) {
  try {
    const { sheetId } = req.params;
    const { options } = req.body;
    await upload(sheetId, options);
    res.status(200).send();
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}
