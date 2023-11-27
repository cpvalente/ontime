import { OAuth2Client } from 'google-auth-library';
import { readFile, writeFile } from 'fs/promises';
import { sheets, sheets_v4 } from '@googleapis/sheets';
import http from 'http';
import { URL } from 'url';
import { logger } from '../classes/Logger.js';
import { getAppDataPath } from '../setup.js';
import { DatabaseModel, LogOrigin } from 'ontime-types';
import { parseExcel } from './parser.js';
import { parseProject, parseRundown, parseUserFields } from './parserFunctions.js';
import { ensureDirectory } from './fileManagement.js';
import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { GoogleSheetState } from 'ontime-types';
import { cellRequenstFromEvent, cellRequenstFromProjectData, getA1Notation } from './googleSheetUtils.js';

type ResponseOK = {
  data: Partial<DatabaseModel>;
};

class sheet {
  private static client: null | OAuth2Client = null;
  private readonly scope = 'https://www.googleapis.com/auth/spreadsheets';
  private readonly sheetsFolder = getAppDataPath() + '/sheets';
  private readonly client_secret = this.sheetsFolder + '/client_secret.json';
  private static authUrl: null | string = null;
  private worksheetId: number = 0;
  private sheetId: string = '';
  private range: string = '';

  public async getSheetState(): Promise<GoogleSheetState> {
    const ret: GoogleSheetState = {
      auth: false,
      id: false,
      worksheet: false,
    };
    this.sheetId = '';
    this.worksheetId = 0;
    if (!sheet.client) {
      return ret;
    }
    try {
      ret.auth = await this.refreshToken();
      if (ret.auth) {
        const settings = DataProvider.getGoogleSheet();
        const x = await this.exist(settings.id, settings.worksheet);
        if (x === true) {
          ret.id = true;
          this.sheetId = settings.id;
        } else if (x !== false) {
          ret.id = true;
          ret.worksheet = true;
          this.sheetId = settings.id;
          this.worksheetId = x.worksheetId;
          this.range = x.range;
        }
      }
    } catch (err) {
      logger.error(LogOrigin.Server, `Google Sheet: Faild to refresh token ${err}`);
    }
    return ret;
  }

  /**
   * test existence of sheet and worksheet
   * @param {string} sheetId - https://docs.google.com/spreadsheets/d/[[spreadsheetId]]/edit#gid=0
   * @param {string} worksheet - the name of the worksheet containing ontime data
   * @returns {Promise<false | {worksheetId: number, range: string}>} - false if not found | true if sheetId existes | id of worksheet and rage of worksheet
   * @throws
   */
  private async exist(
    sheetId: string,
    worksheet: string,
  ): Promise<false | true | { worksheetId: number; range: string }> {
    const spreadsheets = await sheets({ version: 'v4', auth: sheet.client }).spreadsheets.get({
      spreadsheetId: sheetId,
    });

    if (spreadsheets.status === 200) {
      const w = spreadsheets.data.sheets.find((p) => p.properties.title == worksheet);
      if (w !== undefined) {
        const endCell = getA1Notation(w.properties.gridProperties.rowCount, w.properties.gridProperties.columnCount);
        return { worksheetId: w.properties.sheetId, range: worksheet + '!A1:' + endCell };
      } else {
        return true;
      }
    }
    return false;
  }

  /**
   * push sheet
   * @throws
   */
  public async push() {
    const { auth, id, worksheet } = await this.getSheetState();
    if (!auth && !id && !worksheet) {
      throw new Error(`Sheet not authorized or incorrect ID or worksheet`);
    }

    const rq = await sheets({ version: 'v4', auth: sheet.client }).spreadsheets.values.get({
      spreadsheetId: this.sheetId,
      valueRenderOption: 'FORMATTED_VALUE',
      majorDimension: 'ROWS',
      range: this.range,
    });
    if (rq.status === 200) {
      const { rundownMetadata, projectMetadata } = parseExcel(rq.data.values);
      const rundown = DataProvider.getRundown();
      const projectData = DataProvider.getProjectData();
      const titleRow = Object.values(rundownMetadata)[0]['row'];

      const updateRundown = Array<sheets_v4.Schema$Request>();

      // we can't delete the last unflozzen row so we create an empty one
      updateRundown.push({
        insertDimension: {
          inheritFromBefore: false,
          range: {
            dimension: 'ROWS',
            startIndex: titleRow + 1,
            endIndex: titleRow + 2,
            sheetId: this.worksheetId,
          },
        },
      });
      //and delete the rest
      updateRundown.push({
        deleteDimension: { range: { dimension: 'ROWS', startIndex: titleRow + 2, sheetId: this.worksheetId } },
      });
      // insert the lenght of the rundown
      updateRundown.push({
        insertDimension: {
          inheritFromBefore: false,
          range: {
            dimension: 'ROWS',
            startIndex: titleRow + 1,
            endIndex: titleRow + rundown.length,
            sheetId: this.worksheetId,
          },
        },
      });

      //update the corresponding row with event data
      rundown.forEach((entry, index) =>
        updateRundown.push(cellRequenstFromEvent(entry, index, this.worksheetId, rundownMetadata)),
      );

      //update project data
      updateRundown.push(cellRequenstFromProjectData(projectData, this.worksheetId, projectMetadata));

      const writeResponds = await sheets({ version: 'v4', auth: sheet.client }).spreadsheets.batchUpdate({
        spreadsheetId: this.sheetId,
        requestBody: {
          includeSpreadsheetInResponse: false,
          responseRanges: [this.range],
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
   * pull sheet
   * @returns {Promise<Partial<ResponseOK>>}
   * @throws
   */
  public async pull(): Promise<Partial<ResponseOK>> {
    const { auth, id, worksheet } = await this.getSheetState();
    if (!auth && !id && !worksheet) {
      throw new Error(`Sheet not authorized or incorrect ID or worksheet`);
    }

    const res: Partial<ResponseOK> = {};

    const rq = await sheets({ version: 'v4', auth: sheet.client }).spreadsheets.values.get({
      spreadsheetId: this.sheetId,
      valueRenderOption: 'FORMATTED_VALUE',
      majorDimension: 'ROWS',
      range: this.range,
    });
    if (rq.status === 200) {
      res.data = {};
      const dataFromSheet = parseExcel(rq.data.values);
      res.data.rundown = parseRundown(dataFromSheet);
      if (res.data.rundown.length < 1) {
        throw new Error(`Could not find data to import in the worksheet`);
      }
      res.data.project = parseProject(dataFromSheet);
      res.data.userFields = parseUserFields(dataFromSheet);
      return res;
    } else {
      throw new Error(`Sheet read faild: ${rq.statusText}`);
    }
  }

  /**
   * saves secrets object to appdata path as client_secret.json
   * @param {object} secrets
   * @throws
   */
  public async saveClientSecrets(secrets: object) {
    sheet.client = null;
    sheet.authUrl = null;
    ensureDirectory(this.sheetsFolder);
    if (
      'client_id' in secrets ||
      !('project_id' in secrets) ||
      !('auth_uri' in secrets) ||
      !('token_uri' in secrets) ||
      !('auth_provider_x509_cert_url' in secrets) ||
      !('client_secret' in secrets) ||
      !('redirect_uris' in secrets)
    ) {
      throw new Error('Sheet slient secret is missing some keys');
    }
    await writeFile(this.client_secret, JSON.stringify(secrets), 'utf-8');
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
    } catch (_) {
      logger.info(LogOrigin.Server, 'Sheets token expired');
    }
    return false;
  }

  private authServerTimeout;
  /**
   * create local Auth Server
   * @returns {Promise<string | false>} - returns url to serve on success
   * @throws
   */
  public async openAuthServer(): Promise<string | false> {
    //TODO: this only works on local networks
    if (sheet.authUrl) {
      clearTimeout(this.authServerTimeout);
      this.authServerTimeout = setTimeout(
        () => {
          sheet.authUrl = null;
          server.unref;
        },
        2 * 60 * 1000,
      );
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
    //TODO: the server might not start correctly
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
    this.authServerTimeout = setTimeout(
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

export const Sheet = new sheet();
