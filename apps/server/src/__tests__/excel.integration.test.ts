import type { ProjectRundownsList } from 'ontime-types';
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
