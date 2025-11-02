/**
 * This module encapsulates logic related to
 * Google Sheets
 */

import type { AuthenticationStatus, CustomFields, ErrorResponse, Rundown, RundownSummary } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import { Request, Response } from 'express';
import { readFileSync } from 'fs';

import {
  revoke,
  handleClientSecret,
  handleInitialConnection,
  hasAuth,
  download,
  upload,
  getWorksheetOptions,
} from '../../services/sheet-service/SheetService.js';
import { deleteFile } from '../../utils/fileManagement.js';

export async function requestConnection(
  req: Request,
  res: Response<{ verification_url: string; user_code: string } | ErrorResponse>,
) {
  const { sheetId } = req.params;
  // the check for the file is done in the validation middleware
  const filePath = (req.file as Express.Multer.File).path;

  try {
    const client = readFileSync(filePath, 'utf-8');
    const clientSecret = handleClientSecret(client);
    const { verification_url, user_code } = await handleInitialConnection(clientSecret, sheetId);

    res.status(200).send({ verification_url, user_code });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }

  // delete uploaded file after parsing
  await deleteFile(filePath);
}

export async function verifyAuthentication(
  _req: Request,
  res: Response<{ authenticated: AuthenticationStatus } | ErrorResponse>,
) {
  try {
    const authenticated = hasAuth();
    res.status(200).send(authenticated);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
}

export async function revokeAuthentication(
  _req: Request,
  res: Response<{ authenticated: AuthenticationStatus } | ErrorResponse>,
) {
  try {
    const authenticated = revoke();
    res.status(200).send(authenticated);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
}

export async function getWorksheetNamesFromSheet(req: Request, res: Response<string[] | ErrorResponse>) {
  try {
    const { sheetId } = req.params;
    const { worksheetOptions } = await getWorksheetOptions(sheetId);
    res.status(200).send(worksheetOptions);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
}

export async function readFromSheet(
  req: Request,
  res: Response<
    | {
        rundown: Rundown;
        customFields: CustomFields;
        summary: RundownSummary;
      }
    | ErrorResponse
  >,
) {
  try {
    const { sheetId } = req.params;
    const { options } = req.body;
    const data = await download(sheetId, options);
    res.status(200).send(data);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
}

export async function writeToSheet(req: Request, res: Response<void | ErrorResponse>) {
  try {
    const { sheetId } = req.params;
    const { options } = req.body;
    await upload(sheetId, options);
    res.status(200).send();
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
}
