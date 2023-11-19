import { OAuth2Client } from 'google-auth-library';
import { readFile, writeFile } from 'fs/promises';
import { sheets, sheets_v4 } from '@googleapis/sheets';
import http from 'http';
import { URL } from 'url';
import { logger } from '../classes/Logger.js';
import { getAppDataPath } from '../setup.js';
import { DatabaseModel, LogOrigin, OntimeRundownEntry, isOntimeEvent } from 'ontime-types';
import { ExcelImportOptions, isExcelImportMap, defaultExcelImportMap, millisToString } from 'ontime-utils';
import { parseExcel } from './parser.js';
import { parseProject, parseRundown, parseUserFields } from './parserFunctions.js';
import { ensureDirectory } from './fileManagement.js';
import { DataProvider } from '../classes/data-provider/DataProvider.js';

type ResponseOK = {
  data: Partial<DatabaseModel>;
};

class sheet {
  private static client: null | OAuth2Client = null;
  private readonly scope = 'https://www.googleapis.com/auth/spreadsheets';
  private readonly sheetsFolder = getAppDataPath() + '/sheets';
  private readonly client_secret = this.sheetsFolder + '/client_secret.json';
  private readonly token = this.sheetsFolder + '/token.json';
  private static authUrl: null | string = null;

  /**
   * checks the authorized state
   * @returns {Promise<boolean>}
   */
  public async authorized(): Promise<boolean> {
    if (await this.loadToken()) {
      if (await this.refreshToken()) {
        return true;
      }
    } else {
      return false;
    }
  }

  /**
   * test existance of sheet and workssheet and get is index
   * @param {string} sheetId - https://docs.google.com/spreadsheets/d/[[spreadsheetId]]/edit#gid=0
   * @param {string} worksheet - the name of the worksheet containg ontime data
   * @returns {Promise<false | number>} - false if not found | id of worksheet
   * @throws
   */
  public async exist(sheetId: string, worksheet: string): Promise<false | number> {
    const spreadsheets = await sheets({ version: 'v4', auth: sheet.client }).spreadsheets.get({
      spreadsheetId: sheetId,
    });

    if (spreadsheets.status === 200) {
      const w = spreadsheets.data.sheets.find((p) => p.properties.title == worksheet);
      if (w !== undefined) {
        return w.properties.sheetId;
      }
    }
    return false;
  }

  public async push(sheetId: string, worksheet: string, options = defaultExcelImportMap) {
    if (!sheet.client) {
      if (!(await this.authorized())) {
        throw new Error(`Sheet not authorized`);
      }
    }

    const worksheetId = await this.exist(sheetId, worksheet);
    if (!worksheetId) {
      throw new Error(`Sheet not dose not exits`);
    }

    if (!isExcelImportMap(options)) {
      throw new Error('Got incorrect options to excel import', JSON.parse(options));
    }
    const rq = await sheets({ version: 'v4', auth: sheet.client }).spreadsheets.values.get({
      spreadsheetId: sheetId,
      valueRenderOption: 'FORMATTED_VALUE',
      majorDimension: 'ROWS',
      range: worksheet + '!A:Z', //FIXME: this is an abitrary range
    });
    if (rq.status === 200) {
      const { projectMetadata, rundownMetadata } = parseExcel(rq.data.values, options);
      const rundown = DataProvider.getRundown();
      const titleRow = Object.values(rundownMetadata)[0]['row'];

      const updateRundown = Array<sheets_v4.Schema$Request>();

      // we can't delete the last unflozzen row so we create an empty one
      updateRundown.push({
        insertDimension: {
          inheritFromBefore: false,
          range: { dimension: 'ROWS', startIndex: titleRow + 1, endIndex: titleRow + 2, sheetId: worksheetId },
        },
      });
      //and delete the rest
      updateRundown.push({
        deleteDimension: { range: { dimension: 'ROWS', startIndex: titleRow + 2, sheetId: worksheetId } },
      });
      // insert the lenght of the rundown
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

      //TODO: this is a mess
      const titleCol = Object.values(rundownMetadata)
        // .filter(([key, value]) => value !== undefined)
        .reduce((accumulator: number, val) => Math.min(accumulator, val['col']), Number.MAX_VALUE);
      if (titleCol == Number.MAX_VALUE) {
        throw new Error(`could not finde starting title column`);
      }
      //update the corespunding row with event data
      rundown.forEach((entry, index) =>
        updateRundown.push(this.cellRequenstFromEvent(entry, index, worksheetId, rundownMetadata, titleCol as number)),
      );
      const writeResponds = await sheets({ version: 'v4', auth: sheet.client }).spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          includeSpreadsheetInResponse: false,
          responseRanges: [worksheet + '!A:Z'], //FIXME:
          requests: updateRundown,
        },
      });

      if (writeResponds.status == 200) {
        logger.info(LogOrigin.Server, `Sheet write: ${writeResponds.statusText}`);
      } else {
        throw new Error(`Sheet write faild: ${writeResponds.statusText}`);
      }
    } else {
      throw new Error(`Sheet read faild: ${rq.statusText}`);
    }
  }

  /**
   * `parse` a given sheet
   * @param {string} sheetId - https://docs.google.com/spreadsheets/d/[[spreadsheetId]]/edit#gid=0
   * @param {string} worksheet - the name of the worksheet containg ontime data
   * @param {ExcelImportOptions} options
   * @returns {Promise<Partial<ResponseOK>>}
   * @throws
   */
  public async pull(sheetId: string, worksheet: string, options = defaultExcelImportMap) {
    if (!sheet.client) {
      if (!(await this.authorized())) {
        throw new Error(`Sheet not authorized`);
      }
    }
    const res: Partial<ResponseOK> = {};

    if (!isExcelImportMap(options)) {
      throw new Error('Got incorrect options to excel import', JSON.parse(options));
    }

    const rq = await sheets({ version: 'v4', auth: sheet.client }).spreadsheets.values.get({
      spreadsheetId: sheetId,
      valueRenderOption: 'FORMATTED_VALUE',
      majorDimension: 'ROWS',
      range: worksheet + '!A:Z', //FIXME: this is an abitrary range
    });
    if (rq.status === 200) {
      res.data = {};
      const dataFromSheet = parseExcel(rq.data.values, options);
      res.data.rundown = parseRundown(dataFromSheet);
      if (res.data.rundown.length < 1) {
        throw new Error(`Could not find data to import in the worksheet ${options.worksheet}`);
      }
      res.data.project = parseProject(dataFromSheet);
      res.data.userFields = parseUserFields(dataFromSheet);
      return res;
    } else {
      throw new Error(`Sheet read faild: ${rq.statusText}`);
    }
  }

  /**
   * saves Object to appdata path as client_secret.json
   * @param {Object} secrets
   */
  public async saveClientSecrets(secrets: Object) {
    ensureDirectory(this.sheetsFolder);
    logger.info(LogOrigin.Server, 'Sheets: got new client_secret');
    //TODO: test that this is actualy a client file?
    //invalidate previus auths
    sheet.client = null;
    sheet.authUrl = null;
    await writeFile(this.client_secret, JSON.stringify(secrets), 'utf-8');
  }

  /**
   * saves curent client appdata path as token.json
   */
  private async saveToken() {
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: sheet.client._clientId,
      client_secret: sheet.client._clientSecret,
      refresh_token: sheet.client.credentials.refresh_token,
    });
    await writeFile(this.token, payload, 'utf-8');
  }

  /**
   * loads client from appdata path token.json
   * @returns {Promise<boolean>}
   */
  private async loadToken(): Promise<boolean> {
    try {
      const token = JSON.parse(await readFile(this.token, 'utf-8'));
      sheet.client = new OAuth2Client({ clientId: token.client_id, clientSecret: token.client_secret });
      sheet.client.credentials.refresh_token = token.refresh_token;
      return true;
    } catch (err) {
      // logger.error(LogOrigin.Server, `Sheets: ${err}`);
      return false;
    }
  }

  /**
   * refresh the client token
   * @returns {Promise<boolean>}
   */
  async refreshToken(): Promise<boolean> {
    if (!sheet.client?.credentials?.refresh_token) return false;
    try {
      const response = await sheet.client.refreshAccessToken();
      if (response?.credentials) {
        return true;
      }
    } catch (_) {}
    return false;
  }

  /**
   * @param index - the index of the event in rundown dimentions
   */
  private cellRequenstFromEvent(
    event: OntimeRundownEntry,
    index: number,
    worksheetId: number,
    metadata,
    titleCol: number,
  ): sheets_v4.Schema$Request {
    let r: sheets_v4.Schema$CellData[] = [];
    const tmp = Object.entries(metadata)
      .filter(([key, value]) => value !== undefined)
      .sort(([aKey, a], [bKey, b]) => a['col'] - b['col']);

    tmp.forEach(([key, value], index, arr) => {
      if (index != 0) {
        if (arr[index - 1][1]['col'] + 1 < value['col']) {
          arr.splice(index, 0, ['blank', { col: arr[index - 1][1]['col'] + 1 }]);
        }
      }
    });

    tmp.forEach(([key, value]) => {
      if (isOntimeEvent(event)) {
        if (key === 'blank') {
          r.push({});
        } else if (key === 'colour') {
          r.push({
            userEnteredValue: { stringValue: event.colour },
          });
        } else if (typeof event[key] === 'number') {
          r.push({
            userEnteredValue: { stringValue: millisToString(event[key], true) },
          });
        } else if (typeof event[key] === 'string') {
          r.push({
            userEnteredValue: { stringValue: event[key] },
          });
        } else if (typeof event[key] === 'boolean') {
          r.push({
            userEnteredValue: { stringValue: event[key] ? 'x' : '' },
          });
        } else {
          r.push({});
        }
      }
    });
    return {
      updateCells: {
        start: {
          sheetId: worksheetId,
          rowIndex: index + Object.values(metadata)[0]['row'] + 1,
          columnIndex: titleCol,
        },
        fields: 'userEnteredValue',
        rows: [
          {
            values: r,
          },
        ],
      },
    };
  }

  /**
   * create local Auth Server - returns url to serve on success
   * @returns {Promise<string | false>}
   * @throws
   */
  public async openAuthServer(): Promise<string | false> {
    //TODO: this only works on local networks
    if (sheet.authUrl) {
      return sheet.authUrl;
    }
    const creadFile = await readFile(this.client_secret, 'utf-8').catch((err) =>
      logger.error(LogOrigin.Server, `${err}`),
    );
    if (!creadFile) {
      return false;
    }
    const keyFile = JSON.parse(creadFile);
    const keys = keyFile.installed || keyFile.web;
    if (!keys.redirect_uris || keys.redirect_uris.length === 0) {
      logger.error(LogOrigin.Server, `${invalidRedirectUri}`);
      return false;
    }

    // create an oAuth client to authorize the API call
    const redirectUri = new URL(keys.redirect_uris[0]);
    if (redirectUri.hostname !== 'localhost') {
      throw new Error(invalidRedirectUri);
    }

    // create an oAuth client to authorize the API call
    const client = new OAuth2Client({
      clientId: keys.client_id,
      clientSecret: keys.client_secret,
    });

    const server = http.createServer(async (req, res) => {
      try {
        const serverUrl = new URL(req.url, 'http://localhost:3000');
        if (serverUrl.pathname !== redirectUri.pathname) {
          res.end('Invalid callback URL');
          return;
        }
        const searchParams = serverUrl.searchParams;
        if (searchParams.has('error')) {
          res.end('Authorization rejected.');
          logger.info(LogOrigin.Server, `Sheet: ${searchParams.get('error')}`);
          return;
        }
        if (!searchParams.has('code')) {
          res.end('No authentication code provided.');
          logger.info(LogOrigin.Server, `Sheet: Cannot read authentication code`);
          return;
        }
        const code = searchParams.get('code');
        const { tokens } = await client.getToken({
          code: code,
          redirect_uri: redirectUri.toString(),
        });
        client.credentials = tokens;
        sheet.client = client;
        this.saveToken();
        res.end('Authentication successful! Please close this tab and return to OnTime.');
        logger.info(LogOrigin.Server, `Sheet: Authentication successful`);
      } catch (e) {
        logger.error(LogOrigin.Server, `Sheet: ${e}`);
      } finally {
        server.close();
      }
    });
    let listenPort = 3000;
    if (keyFile.installed) {
      // Use emphemeral port if not a web client
      listenPort = 0;
    } else if (redirectUri.port !== '') {
      listenPort = Number(redirectUri.port);
    }
    //FIXME: the server might not start correctly
    server.listen(listenPort, () => {});
    const address = server.address();
    if (typeof address !== 'string') {
      redirectUri.port = String(address.port);
    }
    // open the browser to the authorize url to start the workflow
    const authorizeUrl = client.generateAuthUrl({
      redirect_uri: redirectUri.toString(),
      access_type: 'offline',
      scope: this.scope,
    });
    sheet.authUrl = authorizeUrl;
    setTimeout(
      () => {
        sheet.authUrl = null;
        server.unref;
      },
      2 * 60 * 1000,
    );
    return authorizeUrl;
  }
}

// Copyright 2020 Google LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

//TODO: add modification notifications as requrirde by the license

const invalidRedirectUri = `The provided keyfile does not define a valid
redirect URI. There must be at least one redirect URI defined, and this sample
assumes it redirects to 'http://localhost:3000/oauth2callback'.  Please edit
your keyfile, and add a 'redirect_uris' section.  For example:

"redirect_uris": [
  "http://localhost:3000/oauth2callback"
]
`;

function hexToRgb(hex: string) {
  if (hex === '' || hex[0] !== '#') {
    return { red: 1, green: 1, blue: 1 };
  }
  const bigint = parseInt(hex.slice(1), 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return { red: r, green: g, blue: b };
}

type sheetPos = {
  row: number;
  col: number;
};

function isEqualPartial<T>(a: T, b: Partial<T>) {
  for (const [key, value] of Object.entries(a)) {
    if (b[key] !== undefined && value !== b[key]) {
      return false;
    }
  }
  return true;
}

export const Sheet = new sheet();
