import {
  InvalidSheetsClientSecretError,
  SheetsConnectionRequiredError,
  SpreadsheetUnavailableError,
} from '../sheets.errors.js';
import { getWorksheetOptions, handleClientSecret, handleInitialConnection, hasAuth, init } from '../sheets.service.js';

const { getSpreadsheet } = vi.hoisted(() => ({ getSpreadsheet: vi.fn() }));
vi.mock('@googleapis/sheets', () => ({ sheets: () => ({ spreadsheets: { get: getSpreadsheet } }) }));

beforeEach(() => {
  init();
  vi.useFakeTimers();
  getSpreadsheet.mockReset();
});

afterEach(() => {
  init();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function connect() {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ device_code: 'device', interval: 1, expires_in: 60 })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'test-token' }))),
  );
  getSpreadsheet.mockResolvedValue({ data: { sheets: [{ properties: { title: 'Sheet1' } }] } });
  await handleInitialConnection(
    {
      installed: {
        client_id: 'id',
        client_secret: 'secret',
        auth_uri: '',
        token_uri: '',
        auth_provider_x509_cert_url: '',
      },
    },
    'sheet-id',
  );
  await vi.advanceTimersByTimeAsync(1000);
  expect(hasAuth().authenticated).toBe('authenticated');
}

it.each([
  { response: { status: 400, data: { error: 'invalid_grant' } } },
  { response: { status: 401, data: { error: { code: 401, message: 'Expired credentials' } } } },
])('invalidates a failed Google session so the user can reconnect: %j', async (failure) => {
  await connect();
  getSpreadsheet.mockRejectedValueOnce(failure);

  await expect(getWorksheetOptions('sheet-id')).rejects.toThrow(SheetsConnectionRequiredError);
  expect(hasAuth().authenticated).toBe('not_authenticated');
});

it('keeps authentication when access to a particular spreadsheet is denied', async () => {
  await connect();
  getSpreadsheet.mockRejectedValueOnce({
    response: { status: 404, data: { error: { code: 404, message: 'Not found' } } },
  });

  await expect(getWorksheetOptions('sheet-id')).rejects.toThrow(SpreadsheetUnavailableError);
  expect(hasAuth().authenticated).toBe('authenticated');
});

it('rejects malformed credentials without exposing their contents', () => {
  expect(() => handleClientSecret('private invalid credentials')).toThrowError(new InvalidSheetsClientSecretError());
});
