import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sheets } from '@googleapis/sheets';
import { GoogleSheetsClient } from '../GoogleSheetsClient.js';

vi.mock('@googleapis/sheets', () => ({
  sheets: vi.fn(),
}));

describe('GoogleSheetsClient', () => {
  let mockSheets: any;

  beforeEach(() => {
    mockSheets = {
      spreadsheets: {
        get: vi.fn(),
        values: {
          get: vi.fn(),
        },
        batchUpdate: vi.fn(),
      },
    };
    (sheets as any).mockReturnValue(mockSheets);
  });

  it('should call spreadsheets.get', async () => {
    const client = new GoogleSheetsClient({} as any);
    mockSheets.spreadsheets.get.mockResolvedValue({ data: {} });
    await client.getSpreadsheet('id');
    expect(mockSheets.spreadsheets.get).toHaveBeenCalledWith({
      spreadsheetId: 'id',
      includeGridData: false,
    });
  });

  it('should call spreadsheets.values.get', async () => {
    const client = new GoogleSheetsClient({} as any);
    mockSheets.spreadsheets.values.get.mockResolvedValue({ data: {} });
    await client.getValues('id', 'range');
    expect(mockSheets.spreadsheets.values.get).toHaveBeenCalledWith({
      spreadsheetId: 'id',
      valueRenderOption: 'FORMATTED_VALUE',
      majorDimension: 'ROWS',
      range: 'range',
    });
  });

  it('should call spreadsheets.batchUpdate', async () => {
    const client = new GoogleSheetsClient({} as any);
    mockSheets.spreadsheets.batchUpdate.mockResolvedValue({ data: {} });
    await client.batchUpdate('id', [{ updateCells: {} }], ['range']);
    expect(mockSheets.spreadsheets.batchUpdate).toHaveBeenCalledWith({
      spreadsheetId: 'id',
      requestBody: {
        includeSpreadsheetInResponse: false,
        responseRanges: ['range'],
        requests: [{ updateCells: {} }],
      },
    });
  });
});
