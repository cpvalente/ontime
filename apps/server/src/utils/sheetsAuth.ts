import { OAuth2Client } from 'google-auth-library';
import { readFile, writeFile } from 'fs/promises';
import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';
import { logger } from '../classes/Logger.js';
import { getAppDataPath } from '../setup.js';
import { DatabaseModel, LogOrigin } from 'ontime-types';
import { ExcelImportOptions, isExcelImportMap } from 'ontime-utils';
import { parseExcel } from './parser.js';
import { parseProject, parseRundown, parseUserFields } from './parserFunctions.js';

type ResponseOK = {
  data: Partial<DatabaseModel>;
};

class sheet {
  private static client: null | OAuth2Client = null;
  private readonly scope = 'https://www.googleapis.com/auth/spreadsheets';
  private readonly client_secret = getAppDataPath() + '/client_secret.json';
  private readonly token = getAppDataPath() + '/token.json';
  private static authUrl: null | string = null;

  public async authorized(): Promise<boolean> {
    if (await this.loadToken()) {
      if (await this.refreshToken()) {
        return true;
      }
    } else {
      return false;
    }
  }

  public async parse(sheetId: string, worksheet: string, options: ExcelImportOptions) {
    if (!sheet.client) {
      if (!(await this.authorized())) {
        throw new Error(`Sheet not authorized`);
      }
    }
    console.log(sheetId, worksheet, options);
    const res: Partial<ResponseOK> = {};

    if (!isExcelImportMap(options)) {
      throw new Error('Got incorrect options to excel import', JSON.parse(options));
    }

    const rq = await google.sheets({ version: 'v4', auth: sheet.client }).spreadsheets.values.get({
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

  public async saveClientSecrets(secrets: Object) {
    //TODO: test that this is actualy a client file?
    //invalidate previus auths
    sheet.client = null;
    sheet.authUrl = null;
    await writeFile(getAppDataPath() + '/credentials.json', JSON.stringify(secrets), 'utf-8');
  }

  private async saveToken() {
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: sheet.client._clientId,
      client_secret: sheet.client._clientSecret,
      refresh_token: sheet.client.credentials.refresh_token,
    });
    await writeFile(getAppDataPath() + '/token.json', payload, 'utf-8');
  }

  private async loadToken(): Promise<boolean> {
    try {
      const token = JSON.parse(await readFile(getAppDataPath() + '/token.json', 'utf-8'));
      sheet.client = new OAuth2Client({ clientId: token.client_id, clientSecret: token.client_secret });
      sheet.client.credentials.refresh_token = token.refresh_token;
      return true;
    } catch (err) {
      // logger.error(LogOrigin.Server, `Sheets: ${err}`);
      return false;
    }
  }

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
  
  //TODO: this only works on local networks
  public async openAuthServer(): Promise<string | false> {
    if (sheet.authUrl) {
      return sheet.authUrl;
    }
    const creadFile = await readFile(getAppDataPath() + '/credentials.json', 'utf-8').catch((err) =>
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
    server.listen(listenPort, () => {
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
      return authorizeUrl;
    });
    setTimeout(() => {
      sheet.authUrl = null;
      server.unref;
    }, 2 * 60 * 1000);
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
