/**
 * Service aggregates business logic related
 * to integration with Google Sheets API
 * @link https://developers.google.com/identity/protocols/oauth2/limited-input-device
 */

import { AuthenticationStatus, CustomFields, DatabaseModel, LogOrigin, MaybeString, Rundown } from 'ontime-types';
import { ImportMap, getErrorMessage } from 'ontime-utils';

import { sheets, type sheets_v4 } from '@googleapis/sheets';
import { Credentials, OAuth2Client } from 'google-auth-library';

import { logger } from '../../classes/Logger.js';
import { parseRundowns } from '../../api-data/rundown/rundown.parser.js';
import { getCurrentRundown, getProjectCustomFields } from '../../api-data/rundown/rundown.dao.js';
import { parseExcel } from '../../api-data/excel/excel.parser.js';
import { parseCustomFields } from '../../api-data/custom-fields/customFields.parser.js';

import { cellRequestFromEvent, type ClientSecret, getA1Notation, isClientSecret } from './sheetUtils.js';
import { catchCommonImportXlsxError } from './googleApi.utils.js';
import { consoleError } from '../../utils/console.js';

const sheetScope = 'https://www.googleapis.com/auth/spreadsheets';
const codesUrl = 'https://oauth2.googleapis.com/device/code';
const tokenUrl = 'https://oauth2.googleapis.com/token';
const grantType = 'urn:ietf:params:oauth:grant-type:device_code';

let currentAuthClient: OAuth2Client | null = null;
let currentClientSecret: ClientSecret | null = null;
let currentAuthUrl: MaybeString = null;
let currentAuthCode: MaybeString = null;

let currentSheetId: MaybeString = null;

let pollInterval: NodeJS.Timeout | null = null;
let cleanupTimeout: NodeJS.Timeout | null = null;

function reset() {
  currentAuthClient = null;
  currentClientSecret = null;
  currentAuthUrl = null;
  currentAuthCode = null;

  currentSheetId = null;

  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  if (cleanupTimeout) {
    clearTimeout(cleanupTimeout);
    cleanupTimeout = null;
  }
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

// https://developers.google.com/identity/protocols/oauth2/limited-input-device#success-response
type CodesResponse = {
  device_code: string;
  expires_in: number;
  interval: number;
  user_code: string;
  verification_url: string;
};

/**
 * Establishes connection with Google Auth server and retrieves device codes
 */
async function getDeviceCodes(clientSecret: ClientSecret): Promise<CodesResponse> {
  const response = await fetch(codesUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientSecret.installed.client_id,
      scope: sheetScope,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch device codes: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const deviceCodes: CodesResponse = await response.json();
  return deviceCodes;
}

/**
 * Gets credentials from Google Auth server
 */
function verifyConnection(
  clientSecret: ClientSecret,
  device_code: string,
  interval: number,
  expires_in: number,
  postAction: () => Promise<any>,
) {
  // create poller to check for auth
  pollInterval = setInterval(pollForAuth, interval * 1000);

  // schedule to clear the poller when we know the token is no longer valid
  if (cleanupTimeout) {
    clearTimeout(cleanupTimeout);
    cleanupTimeout = null;
  }
  cleanupTimeout = setTimeout(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }, expires_in * 1000);

  async function pollForAuth() {
    // server returns 428 if user hasnt yet completed the auth process
    try {
      logger.info(LogOrigin.Server, 'Polling for auth...');

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientSecret.installed.client_id,
          client_secret: clientSecret.installed.client_secret,
          device_code,
          grant_type: grantType,
        }),
      });

      if (response.status === 428) {
        throw new Error('user not auth yet');
      }

      if (!response.ok) {
        throw new Error('auth polling failed');
      }

      const auth: Credentials = await response.json();

      logger.info(LogOrigin.Server, 'Successfully Authenticated');
      const client = new OAuth2Client({
        clientId: clientSecret.installed.client_id,
        clientSecret: clientSecret.installed.client_secret,
      });

      client.setCredentials({
        refresh_token: auth.refresh_token,
        access_token: auth.access_token,
        scope: auth.scope,
        token_type: auth.token_type,
      });

      // save client and cancel tasks
      currentAuthClient = client;

      if (cleanupTimeout) {
        clearTimeout(cleanupTimeout);
        cleanupTimeout = null;
      }

      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }

      await postAction();
    } catch (error) {
      if (error instanceof Error) consoleError(error.message);
    }
  }
}

export function hasAuth(): { authenticated: AuthenticationStatus; sheetId: string } {
  if (!currentSheetId) {
    throw new Error('No sheet ID');
  }
  if (cleanupTimeout) {
    return { authenticated: 'pending', sheetId: currentSheetId };
  }
  return { authenticated: currentAuthClient ? 'authenticated' : 'not_authenticated', sheetId: currentSheetId };
}

async function verifySheet(
  sheetId = currentSheetId,
  authClient = currentAuthClient,
): Promise<{ worksheetOptions: string[] }> {
  if (!sheetId || !authClient) {
    throw new Error('Missing sheet ID or authentication');
  }

  try {
    const spreadsheets = await sheets({ version: 'v4', auth: authClient }).spreadsheets.get({
      spreadsheetId: sheetId,
      includeGridData: false,
    });

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
  // TODO: check if the clientSecret has changed
  currentClientSecret = clientSecret;

  // we know there is an ongoing process if there is a timeout for cleanup
  // if there is an ongoing process, we return its data
  if (cleanupTimeout) {
    if (!currentAuthUrl || !currentAuthCode) {
      throw new Error('No ongoing connection');
    }
    return { verification_url: currentAuthUrl, user_code: currentAuthCode };
  }

  const { device_code, expires_in, interval, user_code, verification_url } = await getDeviceCodes(currentClientSecret);
  currentAuthUrl = verification_url;
  currentAuthCode = user_code;
  currentSheetId = sheetId;

  // schedule verifying token and the existence of the sheetID
  verifyConnection(currentClientSecret, device_code, interval, expires_in, verifySheet);

  return { verification_url, user_code };
}

/**
 * Allow calling verification for sheetId
 * @returns
 */
export async function getWorksheetOptions(sheetId: string): ReturnType<typeof verifySheet> {
  if (!currentAuthClient) {
    throw new Error('Not authenticated');
  }
  currentSheetId = sheetId;

  return verifySheet(sheetId);
}

async function verifyWorksheet(sheetId: string, worksheet: string): Promise<{ worksheetId: number; range: string }> {
  if (!currentAuthClient) {
    throw new Error('Not authenticated');
  }

  const spreadsheets = await sheets({ version: 'v4', auth: currentAuthClient }).spreadsheets.get({
    spreadsheetId: sheetId,
  });

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
  /*
    The first spreadsheet provided by google sheet has an id = 0,
    so !0 returns true, the only other number that returns true in this setup is NaN,
    so if x !== 0 && x !== NaN, then !x returns false, we indeed want !NaN to return true,
    but we would like !0 to return false, reason why is also checked that the id is not 0,
    because if it is 0, then I should not enter the condition.
  */
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
  if (!currentAuthClient) {
    throw new Error('Not authenticated');
  }

  const { worksheetId, range } = await verifyWorksheet(sheetId, options.worksheet);

  const readResponse = await sheets({ version: 'v4', auth: currentAuthClient }).spreadsheets.values.get({
    spreadsheetId: sheetId,
    valueRenderOption: 'FORMATTED_VALUE',
    majorDimension: 'ROWS',
    range,
  });

  if (readResponse.status !== 200 || !readResponse.data.values) {
    throw new Error(`Sheet read failed: ${readResponse.statusText}`);
  }

  const { rundownMetadata } = parseExcel(readResponse.data.values, getProjectCustomFields(), 'not-used', options);
  const rundown = getCurrentRundown();
  const titleRow = Object.values(rundownMetadata)[0]['row'];
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
        endIndex: titleRow + rundown.order.length,
        sheetId: worksheetId,
      },
    },
  });

  // update the corresponding row with event data
  rundown.order.forEach((entryId, index) => {
    const entry = rundown.entries[entryId];
    return updateRundown.push(cellRequestFromEvent(entry, index, worksheetId, rundownMetadata));
  });

  const writeResponse = await sheets({ version: 'v4', auth: currentAuthClient }).spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      includeSpreadsheetInResponse: false,
      responseRanges: [range],
      requests: updateRundown,
    },
  });

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
}> {
  if (!currentAuthClient) {
    throw new Error('Not authenticated');
  }

  const { range } = await verifyWorksheet(sheetId, options.worksheet);

  const googleResponse = await sheets({ version: 'v4', auth: currentAuthClient }).spreadsheets.values.get({
    spreadsheetId: sheetId,
    valueRenderOption: 'FORMATTED_VALUE',
    majorDimension: 'ROWS',
    range,
  });

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
  const rundowns = parseRundowns(dataModel, customFields);

  const importedRundown = rundowns[rundownId];
  if (!importedRundown) {
    throw new Error(`Sheet: Rundown with ID ${rundownId} not found in the worksheet`);
  }

  if (importedRundown.order.length < 1) {
    throw new Error('Sheet: Could not find data to import in the worksheet');
  }

  return { rundown: rundowns[rundownId], customFields };
}
