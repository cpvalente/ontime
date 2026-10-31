import type { ProjectRundownsList, Rundown } from 'ontime-types';
import { createEvent, defaultImportMap } from 'ontime-utils';
import xlsx from 'xlsx';

import { EXCEL_MIME } from '../api-data/excel/excel.constants.js';
import { startTestServer } from './testServer.js';

test.each(['', '/client-hash'])(
  'exports all rundowns through the %s deployment',
  { timeout: 15_000 },
  async (prefix) => {
    vi.stubEnv('ROUTER_PREFIX', prefix.replace(/^\//, ''));
    const server = await startTestServer();
    onTestFinished(async () => {
      await server.stop();
      vi.unstubAllEnvs();
    });
    const created = await server.send('POST', `${prefix}/data/rundowns`, { title: 'Export worksheet' });
    expect(created.status).toBe(201);
    const project: ProjectRundownsList = await (await server.get(`${prefix}/data/rundowns`)).json();
    const response = await server.get(`${prefix}/data/excel/export`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain(EXCEL_MIME);
    const workbook = xlsx.read(Buffer.from(await response.arrayBuffer()), { type: 'buffer' });
    expect(workbook.SheetNames).toHaveLength(project.rundowns.length);
    expect(workbook.SheetNames).toContain('Export worksheet');
  },
);

test('both export endpoints match the processed background schedule', { timeout: 15_000 }, async () => {
  vi.stubEnv('ROUTER_PREFIX', '');
  const server = await startTestServer();
  onTestFinished(async () => {
    await server.stop();
    vi.unstubAllEnvs();
  });
  const { getDataProvider } = await import('../classes/data-provider/DataProvider.js');
  const hour = 3600_000;
  const minute = 60_000;
  const rundown: Rundown = {
    id: 'export-schedule',
    title: 'Export schedule',
    revision: 0,
    order: ['a', 'b'],
    flatOrder: ['a', 'b'],
    entries: {
      a: createEvent({ id: 'a', title: 'Opening', timeStart: 10 * hour, duration: 5 * minute, linkStart: false })!,
      b: {
        ...createEvent({ id: 'b', title: 'Linked', duration: 5 * minute, linkStart: true })!,
        timeStart: 0,
        timeEnd: 0,
      },
    },
  };
  await getDataProvider().setRundown(rundown.id, rundown);
  const displayed: Rundown = await (await server.get(`/data/rundowns/${rundown.id}`)).json();
  expect(displayed.entries.b).toMatchObject({ timeStart: 10 * hour + 5 * minute });
  for (const path of ['/data/excel/export', `/data/excel/${rundown.id}/export`]) {
    const response = await server.get(path);
    expect(response.status).toBe(200);
    const workbook = xlsx.read(Buffer.from(await response.arrayBuffer()), { type: 'buffer' });
    const rows = xlsx.utils.sheet_to_json<Record<string, string>>(workbook.Sheets['Export schedule']);
    expect(rows.find((row) => row.Title === 'Linked')).toMatchObject({
      'Time Start': '10:05:00',
      'Time End': '10:10:00',
      Duration: '00:05:00',
    });
  }
});

test(
  'returns actionable errors for missing and empty Excel worksheets and unsupported uploads',
  { timeout: 15_000 },
  async () => {
    vi.stubEnv('ROUTER_PREFIX', '');
    const server = await startTestServer();
    onTestFinished(async () => {
      await server.stop();
      vi.unstubAllEnvs();
    });
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet([['Title']]), 'Empty');
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const upload = (filename: string) => {
      const form = new FormData();
      form.append('excel', new Blob([buffer], { type: EXCEL_MIME }), filename);
      return server.request('/data/excel/upload', { method: 'POST', body: form });
    };
    expect((await upload('schedule.xlsx')).status).toBe(200);
    for (const operation of ['metadata', 'preview']) {
      const response = await server.send(
        'POST',
        `/data/excel/${operation}`,
        operation === 'metadata'
          ? { worksheet: 'Missing' }
          : { options: { ...defaultImportMap, worksheet: 'Missing' } },
      );
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ message: 'Could not find worksheet: Missing' });
    }
    const empty = await server.send('POST', '/data/excel/preview', {
      options: { ...defaultImportMap, worksheet: 'Empty' },
    });
    expect(empty.status).toBe(422);
    expect(await empty.json()).toEqual({ message: 'Could not find data to import in the worksheet: Empty' });
    const unsupported = await upload('schedule.txt');
    expect(unsupported.status).toBe(422);
    expect(await unsupported.json()).toEqual({ message: 'Only .xlsx spreadsheet files are supported' });
  },
);
