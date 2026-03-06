/**
 * Service aggregates business logic related
 * to integration with Google Sheets API
 * @link https://developers.google.com/identity/protocols/oauth2/limited-input-device
 */

import {
  AuthenticationStatus,
  CustomFields,
  DatabaseModel,
  EntryId,
  isOntimeEvent,
  isOntimeMilestone,
  LogOrigin,
  MaybeString,
  OntimeGroup,
  Rundown,
  RundownSummary,
  SupportedEntry,
} from 'ontime-types';
import { ImportMap, getErrorMessage } from 'ontime-utils';

import { type sheets_v4 } from '@googleapis/sheets';
import { OAuth2Client } from 'google-auth-library';

import { logger } from '../../classes/Logger.js';
import { parseRundowns } from '../rundown/rundown.parser.js';

import { getCurrentRundown, getProjectCustomFields, processRundown } from '../rundown/rundown.dao.js';
import { parseExcel } from '../excel/excel.parser.js';
import { parseCustomFields } from '../custom-fields/customFields.parser.js';

import { cellRequestFromEvent, type ClientSecret, getA1Notation, isClientSecret } from './sheets.utils.js';
import { catchCommonImportXlsxError } from './googleApi.utils.js';
import { DeviceAuthProvider } from './DeviceAuthProvider.js';
import { GoogleSheetsClient } from './GoogleSheetsClient.js';

const authProvider = new DeviceAuthProvider();
let currentSheetId: MaybeString = null;

function reset() {
  authProvider.revoke();
  currentSheetId = null;
}

/**
 * Initialise module
 */
export function init() {
  reset();
}

/**
 * Resets all state related to an eventual connection
 */
export function revoke(): ReturnType<typeof hasAuth> {
  reset();
  return hasAuth();
}

/**
 * Parses and validates a client secret string
 */
export function handleClientSecret(clientSecret: string): ClientSecret {
  const clientSecretObject = JSON.parse(clientSecret);

  if (!isClientSecret(clientSecretObject)) {
    throw new Error('Client secret is invalid');
  }

  return clientSecretObject;
}

export function hasAuth(): { authenticated: AuthenticationStatus; sheetId: string } {
  if (!currentSheetId) {
    throw new Error('No sheet ID');
  }
  return { authenticated: authProvider.getStatus(), sheetId: currentSheetId };
}

async function verifySheet(
  sheetId: string,
  authClient: OAuth2Client,
): Promise<{ worksheetOptions: string[] }> {
  try {
    const client = new GoogleSheetsClient(authClient);
    const spreadsheets = await client.getSpreadsheet(sheetId);

    const worksheets: string[] = [];
    spreadsheets.data.sheets?.forEach((sheet) => {
      if (sheet.properties?.title) {
        worksheets.push(sheet.properties.title);
      }
    });

    if (worksheets.length === 0) {
      throw new Error('No worksheets found');
    }
    return { worksheetOptions: worksheets };
  } catch (error) {
    // attempt to catch errors caused by importing xlsx
    catchCommonImportXlsxError(error);
    const errorMessage = getErrorMessage(error);
    throw new Error(`Failed to verify sheet: ${errorMessage}`);
  }
}

export async function handleInitialConnection(
  clientSecret: ClientSecret,
  sheetId: string,
): Promise<{ verification_url: string; user_code: string }> {
  currentSheetId = sheetId;

  if (authProvider.getStatus() === 'pending') {
    const pendingData = authProvider.getPendingData();
    if (!pendingData.verification_url || !pendingData.user_code) {
      throw new Error('No ongoing connection');
    }
    return pendingData as { verification_url: string; user_code: string };
  }

  return authProvider.authenticate(clientSecret, (client) => verifySheet(sheetId, client).then(() => {}));
}

/**
 * Allow calling verification for sheetId
 * @returns
 */
export async function getWorksheetOptions(sheetId: string): ReturnType<typeof verifySheet> {
  const authClient = authProvider.getAuthClient();
  if (!authClient) {
    throw new Error('Not authenticated');
  }
  currentSheetId = sheetId;

  return verifySheet(sheetId, authClient);
}

async function verifyWorksheet(
  client: GoogleSheetsClient,
  sheetId: string,
  worksheet: string,
): Promise<{ worksheetId: number; range: string }> {
  const spreadsheets = await client.getSpreadsheet(sheetId);

  if (spreadsheets.status !== 200) {
    throw new Error(`Request failed: ${spreadsheets.status} ${spreadsheets.statusText}`);
  }

  if (!spreadsheets.data.sheets) {
    throw new Error('No worksheets found');
  }

  const selectedWorksheet = spreadsheets.data.sheets.find(
    (sheet) => sheet.properties?.title && sheet.properties.title.toLowerCase() === worksheet.toLowerCase(),
  );

  if (!selectedWorksheet) {
    throw new Error('Could not find worksheet');
  }

  if (
    !selectedWorksheet.properties ||
    (!selectedWorksheet.properties.sheetId && selectedWorksheet.properties.sheetId !== 0)
  ) {
    throw new Error('Got invalid data from worksheet');
  }

  const endCell = getA1Notation(
    selectedWorksheet.properties?.gridProperties?.rowCount ?? -1,
    selectedWorksheet.properties?.gridProperties?.columnCount ?? -1,
  );
  return { worksheetId: selectedWorksheet.properties.sheetId, range: `${worksheet}!A1:${endCell}` };
}

export async function upload(sheetId: string, options: ImportMap) {
  const authClient = authProvider.getAuthClient();
  if (!authClient) {
    throw new Error('Not authenticated');
  }
  const client = new GoogleSheetsClient(authClient);

  const { worksheetId, range } = await verifyWorksheet(client, sheetId, options.worksheet);

  const readResponse = await client.getValues(sheetId, range);

  if (readResponse.status !== 200 || !readResponse.data.values) {
    throw new Error(`Sheet read failed: ${readResponse.statusText}`);
  }

  const { sheetMetadata } = parseExcel(readResponse.data.values, getProjectCustomFields(), 'not-used', options);
  const rundown = getCurrentRundown();

  const sheetOrder: string[] = [];
  let prevGroup: EntryId | null = null;
  for (const id of rundown.flatOrder) {
    const entry = rundown.entries[id];

    if (isOntimeEvent(entry) || isOntimeMilestone(entry)) {
      if (prevGroup && entry.parent === null) {
        // if we were in a group and are now not insert a group end
        sheetOrder.push(`group-end-${prevGroup}`);
      }
      prevGroup = entry.parent;
    }
    sheetOrder.push(entry.id);
  }

  const titleMetadata = Object.values(sheetMetadata)[0];
  if (titleMetadata === undefined) {
    throw new Error('Sheet read failed: failed to find title row');
  }
  const titleRow = titleMetadata['row'];
  const updateRundown = Array<sheets_v4.Schema$Request>();

  // we can't delete the last unfrozen row so we create an empty one
  updateRundown.push({
    insertDimension: {
      inheritFromBefore: false,
      range: {
        dimension: 'ROWS',
        startIndex: titleRow + 1,
        endIndex: titleRow + 2,
        sheetId: worksheetId,
      },
    },
  });

  // ... and delete the rest
  updateRundown.push({
    deleteDimension: { range: { dimension: 'ROWS', startIndex: titleRow + 2, sheetId: worksheetId } },
  });

  // insert the length of the rundown
  updateRundown.push({
    insertDimension: {
      inheritFromBefore: false,
      range: {
        dimension: 'ROWS',
        startIndex: titleRow + 1,
        endIndex: titleRow + sheetOrder.length,
        sheetId: worksheetId,
      },
    },
  });

  try {
    // update the corresponding row with event data
    sheetOrder.forEach((entryId, index) => {
      const isGroupEnd = entryId.startsWith('group-end-');
      const id = isGroupEnd ? entryId.split('group-end-')[1] : entryId;
      const entry = isGroupEnd
        ? ({ id: entryId, type: SupportedEntry.Group } as OntimeGroup)
        : structuredClone(rundown.entries[id]);
      updateRundown.push(cellRequestFromEvent(entry, index, worksheetId, sheetMetadata));
    });
  } catch (e) {
    throw new Error(`Sheet write failed to correctly parse rundown: ${e}`);
  }

  const writeResponse = await client.batchUpdate(sheetId, updateRundown, [range]);

  if (writeResponse.status === 200) {
    logger.info(LogOrigin.Server, `Sheet write ${writeResponse.statusText}`);
  } else {
    throw new Error(`Sheet write failed: ${writeResponse.statusText}`);
  }
}

/**
 * Imports a sheet as a rundown
 * @throws if the client is not authenticated
 * @throws if the response from Google Sheets fails
 * @throws if the sheet does not contain any data
 */
export async function download(
  sheetId: string,
  options: ImportMap,
): Promise<{
  rundown: Rundown;
  customFields: CustomFields;
  summary: RundownSummary;
}> {
  const authClient = authProvider.getAuthClient();
  if (!authClient) {
    throw new Error('Not authenticated');
  }
  const client = new GoogleSheetsClient(authClient);

  const { range } = await verifyWorksheet(client, sheetId, options.worksheet);

  const googleResponse = await client.getValues(sheetId, range);

  if (googleResponse.status !== 200) {
    throw new Error(`Sheet read failed: ${googleResponse.statusText}`);
  }

  if (!googleResponse.data.values) {
    throw new Error('Sheet: No data found in the worksheet');
  }

  const dataFromSheet = parseExcel(googleResponse.data.values, getProjectCustomFields(), 'Rundown', options);

  const rundownId = dataFromSheet.rundown.id;
  const dataModel: Pick<DatabaseModel, 'rundowns' | 'customFields'> = {
    rundowns: {
      [rundownId]: dataFromSheet.rundown,
    },
    customFields: dataFromSheet.customFields,
  };

  const customFields = parseCustomFields(dataModel);
  const parsedRundown = parseRundowns(dataModel, customFields);

  const importedRundown = parsedRundown[rundownId];
  if (!importedRundown) {
    throw new Error(`Sheet: Rundown with ID ${rundownId} not found in the worksheet`);
  }

  if (importedRundown.order.length < 1) {
    throw new Error('Sheet: Could not find data to import in the worksheet');
  }

  const processedRundown = processRundown(importedRundown, customFields);

  return {
    rundown: {
      id: importedRundown.id,
      title: importedRundown.title,
      order: processedRundown.order,
      flatOrder: processedRundown.flatEntryOrder,
      entries: processedRundown.entries,
      revision: 0,
    },
    summary: {
      duration: processedRundown.totalDuration,
      start: processedRundown.firstStart,
      end: processedRundown.lastEnd,
    },
    customFields,
  };
}
