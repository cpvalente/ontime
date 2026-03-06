import { sheets, type sheets_v4 } from '@googleapis/sheets';
import { OAuth2Client } from 'google-auth-library';

export class GoogleSheetsClient {
  private sheets: sheets_v4.Sheets;

  constructor(auth: OAuth2Client) {
    this.sheets = sheets({ version: 'v4', auth });
  }

  async getSpreadsheet(spreadsheetId: string) {
    return this.sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: false,
    });
  }

  async getValues(spreadsheetId: string, range: string) {
    return this.sheets.spreadsheets.values.get({
      spreadsheetId,
      valueRenderOption: 'FORMATTED_VALUE',
      majorDimension: 'ROWS',
      range,
    });
  }

  async batchUpdate(
    spreadsheetId: string,
    requests: sheets_v4.Schema$Request[],
    responseRanges?: string[],
  ) {
    return this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        includeSpreadsheetInResponse: false,
        responseRanges,
        requests,
      },
    });
  }
}
