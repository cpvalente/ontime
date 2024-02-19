import { DatabaseModel, LogOrigin, MaybeString } from 'ontime-types';
import { ExcelImportMap } from 'ontime-utils';

import { sheets, sheets_v4 } from '@googleapis/sheets';
import { writeFile } from 'fs/promises';
import { readFileSync } from 'fs';
import { OAuth2Client } from 'google-auth-library';
import { join } from 'path';
import got from 'got';

import { logger } from '../classes/Logger.js';
import { getAppDataPath } from '../setup.js';
import { ensureDirectory } from './fileManagement.js';
import { cellRequestFromEvent, getA1Notation } from './sheetUtils.js';
import { parseExcel } from './parser.js';
import { parseRundown, parseUserFields } from './parserFunctions.js';
import { getRundown } from '../services/rundown-service/RundownService.js';

type ResponseOK = {
  data: Partial<DatabaseModel>;
};

class Sheet {
  private static client: null | OAuth2Client = null;
  private readonly scope = 'https://www.googleapis.com/auth/spreadsheets';
  private readonly sheetsFolder: string;
  private readonly clientSecretFile: string;
  private static clientSecret = null;
  private authServerTimeout;

  private currentAuthUrl: MaybeString = null;
  private currentAuthCode: MaybeString = null;

  private readonly requiredClientKeys = [
    'client_id',
    'auth_uri',
    'token_uri',
    'token_uri',
    'auth_provider_x509_cert_url',
    'client_secret',
  ];

  constructor() {
    const appDataPath = getAppDataPath();

    this.sheetsFolder = join(appDataPath, 'sheets');
    this.clientSecretFile = join(this.sheetsFolder, 'client_secret.json');
    ensureDirectory(this.sheetsFolder);

    try {
      const secrets = JSON.parse(readFileSync(this.clientSecretFile, 'utf-8'));
      const isKeyMissing = this.requiredClientKeys.some((key) => !(key in secrets['installed']));
      if (!isKeyMissing) {
        Sheet.clientSecret = secrets;
      }
    } catch (_) {
      /* empty - it is ok that there is no clientSecret */
    }
  }

  /**
   * @description STEP 1 - saves secrets object to appdata path as client_secret.json
   * @param {object} secrets
   * @throws
   */
  public async saveClientSecrets(secrets: object) {
    Sheet.client = null;
    Sheet.clientSecret = null;
    this.currentAuthUrl = null;
    this.currentAuthCode = null;

    const isKeyMissing = this.requiredClientKeys.some((key) => !(key in secrets['installed']));
    if (isKeyMissing) {
      throw new Error('Client file is missing some keys');
    }

    try {
      await writeFile(this.clientSecretFile, JSON.stringify(secrets), 'utf-8');
      Sheet.clientSecret = secrets;
    } catch (error) {
      throw new Error(`Unable to save client file to disk ${error}`);
    }
  }

  /**
   * @description STEP 1 - test that the saved object is present
   */
  testClientSecret() {
    return Sheet.clientSecret !== null;
  }

  /**
   * @description STEP 2 - create server to interact with th OAuth2 request
   * @returns {Promise<string | null>} - returns url path serve on success
   * @throws
   */
  async openAuthServer(): Promise<{ verification_url: string; user_code: string }> {
    // if the server is already running return it
    if (this.authServerTimeout) {
      return { verification_url: this.currentAuthUrl, user_code: this.currentAuthCode };
    }

    // Check that Secret is valid
    const keyFile = Sheet.clientSecret;
    const keys = keyFile.installed;

    const client = new OAuth2Client({
      clientId: keys.client_id,
      clientSecret: keys.client_secret,
    });

    const deviceCodes = await got.post('https://oauth2.googleapis.com/device/code', {
      json: {
        client_id: keys.client_id,
        scope: sheet.scope,
      },
    });

    const { device_code, expires_in, interval, user_code, verification_url } = JSON.parse(deviceCodes.body);

    const testInterval = setInterval(() => {
      got
        .post('https://oauth2.googleapis.com/token', {
          json: {
            client_id: keys.client_id,
            client_secret: keys.client_secret,
            device_code,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          },
        })
        .then(
          (res) => {
            const auth = JSON.parse(res.body);
            console.log(auth);
            client.setCredentials({
              refresh_token: auth.refresh_token,
              access_token: auth.access_token,
              scope: auth.scope,
              token_type: auth.token_type,
            });
            Sheet.client = client;
            clearTimeout(this.authServerTimeout);
            clearInterval(testInterval);
          },
          (res) => {
            console.log(res.response.body);
          },
        );
    }, interval * 1000);

    clearTimeout(this.authServerTimeout);

    this.authServerTimeout = setTimeout(() => {
      clearInterval(testInterval);
    }, expires_in * 1000);

    this.currentAuthUrl = verification_url;
    this.currentAuthCode = user_code;
    return { verification_url, user_code };
  }

  /**
   * @description STEP 2 - test that the received OAuth2 is still valid
   * @throws
   */
  async testAuthentication() {
    if (Sheet.client) {
      return true;
    }
    throw new Error('Unable to authenticate');
  }

  /**
   * @description STEP 3 - test the given sheet id
   * @throws
   */
  async testSheetId(sheetId: string) {
    const spreadsheets = await sheets({ version: 'v4', auth: Sheet.client }).spreadsheets.get({
      spreadsheetId: sheetId,
      includeGridData: false,
    });
    if (spreadsheets.status !== 200) {
      throw new Error(spreadsheets.statusText);
    }
    return { worksheetOptions: spreadsheets.data.sheets.map((i) => i.properties.title) };
  }

  /**
   * @description STEP 4 - test the given worksheet
   * @throws
   */
  async testWorksheet(sheetId: string, worksheet: string) {
    const spreadsheets = await sheets({ version: 'v4', auth: Sheet.client }).spreadsheets.get({
      spreadsheetId: sheetId,
      includeGridData: false,
    });
    if (spreadsheets.status !== 200) {
      throw new Error(spreadsheets.statusText);
    }
    const worksheetExist = spreadsheets.data.sheets.find((i) => i.properties.title === worksheet);
    if (!worksheetExist) {
      throw new Error('Unable to find worksheet');
    }
  }

  /**
   * test existence of sheet and worksheet
   * @param {string} sheetId - https://docs.google.com/spreadsheets/d/[[spreadsheetId]]/edit#gid=0
   * @param {string} worksheet - the name of the worksheet containing ontime data
   * @returns {Promise<{worksheetId: number, range: string}>} - id of worksheet and rage of worksheet
   * @throws
   */
  private async exist(sheetId: string, worksheet: string): Promise<{ worksheetId: number; range: string }> {
    const spreadsheets = await sheets({ version: 'v4', auth: Sheet.client }).spreadsheets.get({
      spreadsheetId: sheetId,
    });

    if (spreadsheets.status !== 200) {
      throw new Error(`Request failed: ${spreadsheets.status} ${spreadsheets.statusText}`);
    }

    const selectedWorksheet = spreadsheets.data.sheets.find((n) => n.properties.title == worksheet);

    if (!selectedWorksheet) {
      throw new Error('Could not find worksheet');
    }

    const endCell = getA1Notation(
      selectedWorksheet.properties.gridProperties.rowCount,
      selectedWorksheet.properties.gridProperties.columnCount,
    );
    return { worksheetId: selectedWorksheet.properties.sheetId, range: `${worksheet}!A1:${endCell}` };
  }

  /**
   * @description STEP 5 - Upload the rundown to sheet
   * @param {string} id - id of the sheet https://docs.google.com/spreadsheets/d/[[spreadsheetId]]/edit#gid=0
   * @param {ExcelImportMap} options
   * @throws
   */
  public async push(id: string, options: ExcelImportMap) {
    const { worksheetId, range } = await this.exist(id, options.worksheet);

    const readResponse = await sheets({ version: 'v4', auth: Sheet.client }).spreadsheets.values.get({
      spreadsheetId: id,
      valueRenderOption: 'FORMATTED_VALUE',
      majorDimension: 'ROWS',
      range,
    });

    if (readResponse.status !== 200) {
      throw new Error(`Sheet: read failed: ${readResponse.statusText}`);
    }

    const { rundownMetadata } = parseExcel(readResponse.data.values, options);
    const rundown = getRundown();
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

    //and delete the rest
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
          endIndex: titleRow + rundown.length,
          sheetId: worksheetId,
        },
      },
    });

    //update the corresponding row with event data
    rundown.forEach((entry, index) =>
      updateRundown.push(cellRequestFromEvent(entry, index, worksheetId, rundownMetadata)),
    );

    const writeResponse = await sheets({ version: 'v4', auth: Sheet.client }).spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: {
        includeSpreadsheetInResponse: false,
        responseRanges: [range],
        requests: updateRundown,
      },
    });

    if (writeResponse.status === 200) {
      logger.info(LogOrigin.Server, `Sheet: write ${writeResponse.statusText}`);
    } else {
      throw new Error(`Sheet: write failed ${writeResponse.statusText}`);
    }
  }

  /**
   * @description STEP 5 - Download the rundown from sheet
   * @param {string} sheetId - id of the sheet https://docs.google.com/spreadsheets/d/[[spreadsheetId]]/edit#gid=0
   * @param {ExcelImportMap} options
   * @returns {Promise<Partial<ResponseOK>>}
   * @throws
   */
  public async pull(sheetId: string, options: ExcelImportMap): Promise<Partial<ResponseOK>> {
    const { range } = await this.exist(sheetId, options.worksheet);

    const res: Partial<ResponseOK> = {};

    const googleResponse = await sheets({ version: 'v4', auth: Sheet.client }).spreadsheets.values.get({
      spreadsheetId: sheetId,
      valueRenderOption: 'FORMATTED_VALUE',
      majorDimension: 'ROWS',
      range,
    });

    // TODO: we need to pass this into a service that can safely merge the datasets
    if (googleResponse.status === 200) {
      res.data = {};
      const dataFromSheet = parseExcel(googleResponse.data.values, options);
      res.data.rundown = parseRundown(dataFromSheet);
      if (res.data.rundown.length < 1) {
        throw new Error('Sheet: Could not find data to import in the worksheet');
      }
      res.data.userFields = parseUserFields(dataFromSheet);
      return res;
    } else {
      throw new Error(`Sheet: read failed: ${googleResponse.statusText}`);
    }
  }
}

export const sheet = new Sheet();
