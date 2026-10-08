import type { sheets_v4 } from '@googleapis/sheets';
import { ProjectRundownsList, Rundown, RundownSummary } from 'ontime-types';
import { defaultImportMap } from 'ontime-utils';

import { type TestServer, startTestServer } from './testServer.js';

/**
 * Baseline for the Google Sheets integration, from the HTTP routes down to the Google API
 * Only the outbound edges are replaced: the Sheets client and the OAuth device flow requests
 */
const google = vi.hoisted(() => ({
  getSpreadsheet: vi.fn<(request: { spreadsheetId: string }) => Promise<unknown>>(),
  getValues: vi.fn<(request: { spreadsheetId: string; range: string }) => Promise<unknown>>(),
  batchUpdate: vi.fn<(request: sheets_v4.Params$Resource$Spreadsheets$Batchupdate) => Promise<unknown>>(),
}));

vi.mock('@googleapis/sheets', () => ({
  sheets: () => ({
    spreadsheets: {
      get: google.getSpreadsheet,
      values: { get: google.getValues },
      batchUpdate: google.batchUpdate,
    },
  }),
}));

const codesUrl = 'https://oauth2.googleapis.com/device/code';
const tokenUrl = 'https://oauth2.googleapis.com/token';

const sheetId = 'a'.repeat(44);
const clientSecret = {
  installed: {
    client_id: 'client-id',
    client_secret: 'secret',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: tokenUrl,
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  },
};

const worksheetRows = [
  ['Cue', 'Time start', 'Duration', 'Title', 'Note'],
  ['1', '10:00:00', '00:30:00', 'Opening', 'Welcome the audience'],
  ['2', '10:30:00', '01:00:00', 'Keynote', ''],
];

const importOptions = { ...defaultImportMap, worksheet: 'Main' };

function worksheet(title: string, sheetId = 0, rowCount = 20, columnCount = 5) {
  return { properties: { title, sheetId, gridProperties: { rowCount, columnCount } } };
}

function spreadsheetResponse(sheets: unknown[] = [worksheet('Main')], title = 'Show file') {
  return { status: 200, statusText: 'OK', data: { properties: { title }, sheets } };
}

function valuesResponse(values: unknown[][] | null = worksheetRows, status = 200) {
  return { status, statusText: status === 200 ? 'OK' : 'Failed', data: { values: values ?? undefined } };
}

describe('Google Sheets integration', { timeout: 15_000 }, () => {
  let server: TestServer;
  const realFetch = globalThis.fetch;
  const oauthRequests: string[] = [];
  let userHasApproved = false;
  let deviceCodeStatus = 200;
  let codesExpireInSeconds = 60;

  // requests to Google are answered here, anything else (our own server) goes through
  const fetchStub = async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === codesUrl) {
      oauthRequests.push(url);
      if (deviceCodeStatus !== 200) {
        return new Response('quota exceeded', { status: deviceCodeStatus });
      }
      return Response.json({
        device_code: 'device-code',
        user_code: 'ABCD-EFGH',
        verification_url: 'https://www.google.com/device',
        // the poll interval is in seconds, we keep it short to avoid waiting
        interval: 0.05,
        expires_in: codesExpireInSeconds,
      });
    }
    if (url === tokenUrl) {
      oauthRequests.push(url);
      if (!userHasApproved) return new Response('', { status: 428 });
      return Response.json({ access_token: 'access', refresh_token: 'refresh', token_type: 'Bearer' });
    }
    return realFetch(input, init);
  };

  beforeAll(async () => {
    vi.stubGlobal('fetch', fetchStub);
    server = await startTestServer();
  }, 15_000);

  afterAll(async () => {
    await server?.stop();
    vi.unstubAllGlobals();
  });

  beforeEach(async () => {
    await server.send('POST', '/data/sheets/revoke');
    userHasApproved = false;
    deviceCodeStatus = 200;
    codesExpireInSeconds = 60;
    oauthRequests.length = 0;
    vi.resetAllMocks();
    google.getSpreadsheet.mockResolvedValue(spreadsheetResponse());
    google.getValues.mockResolvedValue(valuesResponse());
    google.batchUpdate.mockResolvedValue({ status: 200, statusText: 'OK' });
  });

  async function authStatus() {
    return (await server.get('/data/sheets/connect')).json();
  }

  function connectRequest(secret: unknown = clientSecret, id = sheetId) {
    const form = new FormData();
    form.append('client_secret', new Blob([JSON.stringify(secret)], { type: 'application/json' }), 'secret.json');
    return server.request(`/data/sheets/${id}/connect`, { method: 'POST', body: form });
  }

  /** goes through the device flow, as a user who approves the access in the Google page */
  async function authenticate() {
    expect((await connectRequest()).status).toBe(200);
    userHasApproved = true;
    await vi.waitFor(async () => expect(await authStatus()).toMatchObject({ authenticated: 'authenticated' }), {
      timeout: 5000,
    });
  }

  async function post(path: string, body?: unknown) {
    const response = await server.send('POST', `/data/sheets/${sheetId}/${path}`, body);
    return { status: response.status, body: await response.json() };
  }

  describe('authentication', () => {
    test('is pending until the user approves access in Google, then authenticated', async () => {
      expect(await authStatus()).toStrictEqual({ authenticated: 'not_authenticated', sheetId: '' });

      const response = await connectRequest();
      expect(response.status).toBe(200);
      expect(await response.json()).toStrictEqual({
        verification_url: 'https://www.google.com/device',
        user_code: 'ABCD-EFGH',
      });
      expect(await authStatus()).toStrictEqual({ authenticated: 'pending', sheetId });

      userHasApproved = true;
      await vi.waitFor(
        async () => expect(await authStatus()).toStrictEqual({ authenticated: 'authenticated', sheetId }),
        {
          timeout: 5000,
        },
      );
      // the sheet is checked as soon as we are allowed to read it
      expect(google.getSpreadsheet).toHaveBeenCalledWith(expect.objectContaining({ spreadsheetId: sheetId }));
    });

    test('revoking forgets the connection', async () => {
      await authenticate();

      const response = await server.send('POST', '/data/sheets/revoke');

      expect(await response.json()).toStrictEqual({ authenticated: 'not_authenticated', sheetId: '' });
      expect((await post('worksheet-options')).body).toStrictEqual({ message: 'Not authenticated' });
    });

    test('hands out the same codes while a connection is pending, instead of asking Google again', async () => {
      const first = await (await connectRequest()).json();
      const second = await (await connectRequest()).json();

      expect(second).toStrictEqual(first);
      expect(oauthRequests.filter((url) => url === codesUrl)).toHaveLength(1);
    });

    // known issue: the pending state is never cleared when the codes expire, only revoking recovers
    test.fails('goes back to not authenticated, with fresh codes, once the codes expire unused', async () => {
      codesExpireInSeconds = 0.2;
      await connectRequest();

      await vi.waitFor(async () => expect(await authStatus()).toMatchObject({ authenticated: 'not_authenticated' }), {
        timeout: 1000,
      });
      await connectRequest();
      expect(oauthRequests.filter((url) => url === codesUrl)).toHaveLength(2);
    });

    test('reports when Google refuses to issue codes', async () => {
      deviceCodeStatus = 403;

      const response = await connectRequest();

      expect(response.status).toBe(500);
      expect(await response.json()).toStrictEqual({
        message: expect.stringContaining('Failed to fetch device codes: 403'),
      });
      expect(await authStatus()).toMatchObject({ authenticated: 'not_authenticated' });
    });

    test('rejects a client secret which is not valid, without contacting Google', async () => {
      const response = await connectRequest({ web: { client_id: 'wrong type of credentials' } });

      expect(response.status).toBe(500);
      expect(await response.json()).toStrictEqual({ message: 'Client secret is invalid' });
      expect(oauthRequests).toHaveLength(0);
    });

    test('rejects connection requests without a client secret file or with a malformed sheet id', async () => {
      const noFile = await server.send('POST', `/data/sheets/${sheetId}/connect`, {});
      expect(noFile.status).toBe(422);

      const shortId = await connectRequest(clientSecret, 'too-short');
      expect(shortId.status).toBe(422);
      expect(oauthRequests).toHaveLength(0);
    });
  });

  test.each([
    ['worksheet-options', {}],
    ['metadata', { worksheet: 'Main' }],
    ['read', { options: importOptions }],
    ['write', { options: importOptions }],
  ])('%s requires an authenticated connection', async (operation, body) => {
    expect(await post(operation, body)).toStrictEqual({ status: 500, body: { message: 'Not authenticated' } });
    expect(google.getSpreadsheet).not.toHaveBeenCalled();
    expect(google.batchUpdate).not.toHaveBeenCalled();
  });

  test('rejects requests which are missing the information needed to read or write a sheet', async () => {
    await authenticate();

    const statuses = [
      (await post('metadata', {})).status,
      (await post('read', {})).status,
      (await post('read', { options: { worksheet: 'Main' } })).status, // incomplete import map
      (await post('write', {})).status,
    ];

    expect(statuses).toStrictEqual([422, 422, 422, 422]);
    expect(google.getValues).not.toHaveBeenCalled();
    expect(google.batchUpdate).not.toHaveBeenCalled();
  });

  describe('worksheet options', () => {
    test('lists the worksheets and the name of the spreadsheet', async () => {
      await authenticate();
      google.getSpreadsheet.mockResolvedValue(spreadsheetResponse([worksheet('Main'), worksheet('Backup', 1)], 'Gala'));

      expect(await post('worksheet-options')).toStrictEqual({
        status: 200,
        body: { worksheets: ['Main', 'Backup'], metadata: null, title: 'Gala' },
      });
    });

    test('explains when the linked file is an xlsx and not a Google Sheet', async () => {
      await authenticate();
      google.getSpreadsheet.mockRejectedValue({
        code: 400,
        message: 'unsupported',
        errors: [{ reason: 'failedPrecondition', message: 'This operation is not supported for this document' }],
      });

      const { status, body } = await post('worksheet-options');

      expect(status).toBe(500);
      expect(body.message).toContain('.xlsx');
    });

    test('reports a spreadsheet without worksheets', async () => {
      await authenticate();
      google.getSpreadsheet.mockResolvedValue(spreadsheetResponse([]));

      const { status, body } = await post('worksheet-options');

      expect(status).toBe(500);
      expect(body.message).toContain('No worksheets found');
    });
  });

  describe('worksheet metadata', () => {
    test('finds the column headers of a worksheet, whatever the case of its name', async () => {
      await authenticate();

      expect(await post('metadata', { worksheet: 'main' })).toStrictEqual({
        status: 200,
        body: { worksheet: 'main', headers: ['Cue', 'Time start', 'Duration', 'Title', 'Note'] },
      });
    });

    test('reports a worksheet which does not exist or is empty', async () => {
      await authenticate();
      expect((await post('metadata', { worksheet: 'Other' })).body.message).toBe('Could not find worksheet');

      google.getValues.mockResolvedValue(valuesResponse(null));
      expect((await post('metadata', { worksheet: 'Main' })).body.message).toBe(
        'Sheet: No data found in the worksheet',
      );
    });
  });

  describe('reading a rundown from a sheet', () => {
    test('previews the sheet as a rundown, with its summary', async () => {
      await authenticate();

      const { status, body } = await post('read', { options: importOptions });

      expect(status).toBe(200);
      const preview = body as { rundown: Rundown; summary: RundownSummary };
      const events = preview.rundown.flatOrder.map((id) => preview.rundown.entries[id]);
      expect(events).toMatchObject([
        { title: 'Opening', cue: '1', timeStart: 10 * 3600_000, duration: 30 * 60_000, note: 'Welcome the audience' },
        { title: 'Keynote', cue: '2', timeStart: 10.5 * 3600_000, duration: 3600_000 },
      ]);
      expect(preview.summary).toStrictEqual({ start: 10 * 3600_000, end: 11.5 * 3600_000, duration: 90 * 60_000 });
    });

    test('previewing does not change the project rundown', async () => {
      await authenticate();
      const before = await (await server.get('/data/rundowns/current')).json();

      expect((await post('read', { options: importOptions })).status).toBe(200);

      expect(await (await server.get('/data/rundowns/current')).json()).toStrictEqual(before);
    });

    test('reports a sheet without rows to import', async () => {
      await authenticate();
      google.getValues.mockResolvedValue(valuesResponse(null));
      expect((await post('read', { options: importOptions })).body.message).toBe(
        'Sheet: No data found in the worksheet',
      );

      google.getValues.mockResolvedValue(valuesResponse([['Cue', 'Time start', 'Title']]));
      expect((await post('read', { options: importOptions })).body.message).toBe(
        'Sheet: Could not find data to import in the worksheet',
      );
    });

    test('reports when Google fails to return the values', async () => {
      await authenticate();
      google.getValues.mockResolvedValue(valuesResponse(null, 500));

      const { status, body } = await post('read', { options: importOptions });

      expect(status).toBe(500);
      expect(body.message).toContain('Sheet read failed');
    });
  });

  describe('writing the rundown to a sheet', () => {
    test('exports the loaded rundown in order to the selected worksheet, preserving its header', async () => {
      await authenticate();
      const original: Rundown = await (await server.get('/data/rundowns/current')).json();
      const created: ProjectRundownsList = await (
        await server.send('POST', '/data/rundowns', { title: 'Sheet export' })
      ).json();
      const exportId = created.rundowns.find((rundown) => rundown.title === 'Sheet export')!.id;

      try {
        const events = [
          {
            type: 'event',
            cue: '1',
            timeStart: 10 * 3600_000,
            duration: 30 * 60_000,
            title: 'Opening',
            note: 'Welcome the audience',
          },
          { type: 'event', cue: '2', timeStart: 10.5 * 3600_000, duration: 3600_000, title: 'Keynote', note: '' },
        ];
        for (const event of events) {
          expect((await server.send('POST', `/data/rundowns/${exportId}/entry`, event)).status).toBe(201);
        }
        expect((await server.send('POST', `/data/rundowns/${exportId}/load`)).status).toBe(200);
        google.getSpreadsheet.mockResolvedValue(spreadsheetResponse([worksheet('Main', 17)]));
        google.getValues.mockResolvedValue(
          valuesResponse([
            ['Show file'],
            worksheetRows[0],
            ['old', '01:00:00', '00:05:00', 'Stale sheet row', 'old note'],
          ]),
        );

        expect((await server.send('POST', `/data/sheets/${sheetId}/write`, { options: importOptions })).status).toBe(
          200,
        );

        expect(google.batchUpdate).toHaveBeenCalledOnce();
        const { spreadsheetId, requestBody } = google.batchUpdate.mock.calls[0][0];
        expect(spreadsheetId).toBe(sheetId);
        const requests = requestBody!.requests!;
        expect(requests).toContainEqual({
          deleteDimension: { range: { dimension: 'ROWS', startIndex: 3, sheetId: 17 } },
        });
        const updates = requests.filter((request) => request.updateCells).map((request) => request.updateCells!);
        expect(updates.map((update) => update.start)).toStrictEqual([
          { sheetId: 17, rowIndex: 2, columnIndex: 0 },
          { sheetId: 17, rowIndex: 3, columnIndex: 0 },
        ]);
        expect(
          updates.map((update) => update.rows?.[0]?.values?.map((cell) => cell.userEnteredValue?.stringValue)),
        ).toStrictEqual(worksheetRows.slice(1));
      } finally {
        await server.send('POST', `/data/rundowns/${original.id}/load`);
        await server.send('DELETE', `/data/rundowns/${exportId}`);
      }
    });

    test('reports when Google rejects the update', async () => {
      await authenticate();
      google.batchUpdate.mockResolvedValue({ status: 500, statusText: 'Internal error' });

      const { status, body } = await post('write', { options: importOptions });

      expect(status).toBe(500);
      expect(body.message).toBe('Sheet write failed: Internal error');
    });

    test('does not write when the sheet has no header row to write under', async () => {
      await authenticate();
      google.getValues.mockResolvedValue(valuesResponse([['Something', 'else']]));

      const { status, body } = await post('write', { options: importOptions });

      expect(status).toBe(500);
      expect(body.message).toBe('Sheet read failed: failed to find title row');
      expect(google.batchUpdate).not.toHaveBeenCalled();
    });
  });
});
