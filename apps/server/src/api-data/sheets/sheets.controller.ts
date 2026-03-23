/**
 * This module encapsulates logic related to
 * Google Sheets
 */

import { readFileSync } from 'fs';

import { Request, Response } from 'express';
import type {
  AuthenticationStatus,
  ErrorResponse,
  SpreadsheetPreviewResponse,
  SpreadsheetWorksheetMetadata,
  SpreadsheetWorksheetOptions,
} from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import { deleteFile } from '../../utils/fileManagement.js';
import {
  download,
  getWorksheetMetadata,
  getWorksheetOptions,
  handleClientSecret,
  handleInitialConnection,
  hasAuth,
  revoke,
  upload,
} from './sheets.service.js';

/**
 * Starts the Google device authorization flow for the provided sheet.
 */
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

/**
 * Returns the current Google Sheets authentication status for this server session.
 */
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

/**
 * Clears the current Google Sheets authentication session.
 */
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

/**
 * Lists worksheet titles. Metadata is loaded lazily for the selected worksheet.
 */
export async function getWorksheetOptionsFromSheet(
  req: Request,
  res: Response<SpreadsheetWorksheetOptions | ErrorResponse>,
) {
  try {
    const { sheetId } = req.params;
    const worksheetOptions = await getWorksheetOptions(sheetId);
    res.status(200).send(worksheetOptions);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
}

/**
 * Returns derived metadata for a single worksheet by inspecting its row data.
 */
export async function getWorksheetMetadataFromSheet(
  req: Request,
  res: Response<SpreadsheetWorksheetMetadata | ErrorResponse>,
) {
  try {
    const { sheetId } = req.params;
    const { worksheet } = req.body;
    const metadata = await getWorksheetMetadata(sheetId, worksheet);
    res.status(200).send(metadata);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
}

/**
 * Reads a Google Sheet worksheet and converts it into a rundown preview.
 */
export async function readFromSheet(req: Request, res: Response<SpreadsheetPreviewResponse | ErrorResponse>) {
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

/**
 * Writes the current rundown back to the selected Google Sheet worksheet.
 */
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
