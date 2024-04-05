/**
 * This module encapsulates logic related to
 * Google Sheets
 */

import { Request, Response } from 'express';
import { readFileSync } from 'fs';

import type { AuthenticationStatus, CustomFields, ErrorResponse, OntimeRundown } from 'ontime-types';

import { deleteFile } from '../../utils/parserUtils.js';
import {
  revoke,
  handleClientSecret,
  handleInitialConnection,
  hasAuth,
  download,
  upload,
} from '../../services/sheet-service/SheetService.js';
import { getErrorMessage } from 'ontime-utils';

export async function requestConnection(
  req: Request,
  res: Response<{ verification_url: string; user_code: string } | ErrorResponse>,
) {
  const { sheetId } = req.params;
  const file = req.file.path;

  try {
    const client = readFileSync(file, 'utf-8');
    const clientSecret = handleClientSecret(client);
    const { verification_url, user_code } = await handleInitialConnection(clientSecret, sheetId);

    res.status(200).send({ verification_url, user_code });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }

  // delete uploaded file after parsing
  try {
    deleteFile(file);
  } catch (_error) {
    /** we dont handle failure here */
  }
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

export async function readFromSheet(
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
