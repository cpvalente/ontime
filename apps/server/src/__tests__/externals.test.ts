import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { getCloudAttributes, updateRouterPrefix } from '../externals.js';

const environment = vi.hoisted(() => ({ isOntimeCloud: false, dashboardUrl: undefined as string | undefined }));
const files = vi.hoisted(() => ({ clientIndexHtml: '' }));

vi.mock('../setup/environment.js', () => ({
  get isOntimeCloud() {
    return environment.isOntimeCloud;
  },
  get dashboardUrl() {
    return environment.dashboardUrl;
  },
}));
vi.mock('../setup/index.js', () => ({ srcFiles: files }));

describe('getCloudAttributes', () => {
  test('writes an https dashboard URL next to the cloud flag', () => {
    expect(getCloudAttributes('https://cloud.example/stages')).toBe(
      'data-is-cloud data-dashboard-url="https://cloud.example/stages"',
    );
  });

  test('trims the dashboard URL and treats whitespace as missing', () => {
    expect(getCloudAttributes(' https://cloud.example/stages ')).toBe(
      'data-is-cloud data-dashboard-url="https://cloud.example/stages"',
    );
    expect(getCloudAttributes('  ')).toBe('data-is-cloud');
    expect(getCloudAttributes(undefined)).toBe('data-is-cloud');
  });

  test('escapes the dashboard URL for an HTML attribute', () => {
    expect(getCloudAttributes(`https://cloud.example/'x'?a="1"&b=2`)).toBe(
      'data-is-cloud data-dashboard-url="https://cloud.example/&#39;x&#39;?a=%221%22&amp;b=2"',
    );
  });

  test.each(['http://cloud.example', 'javascript:alert(1)', 'cloud.example', '//cloud.example', 'not a url'])(
    'leaves out a dashboard URL that is not https: %s',
    (dashboardUrl) => {
      expect(getCloudAttributes(dashboardUrl)).toBe('data-is-cloud');
    },
  );
});

describe('updateRouterPrefix', () => {
  beforeEach(() => {
    files.clientIndexHtml = join(mkdtempSync(join(tmpdir(), 'ontime-index-')), 'index.html');
    writeFileSync(files.clientIndexHtml, '<head>\n    <base href="/" />\n</head>');
  });

  afterEach(() => {
    rmSync(dirname(files.clientIndexHtml), { recursive: true, force: true });
    Object.assign(environment, { isOntimeCloud: false, dashboardUrl: undefined });
  });

  const readIndex = () => readFileSync(files.clientIndexHtml, 'utf-8');

  test('writes only the prefix off cloud', () => {
    environment.dashboardUrl = 'https://cloud.example/stages';
    expect(updateRouterPrefix('client-hash')).toBe('/client-hash');
    expect(readIndex()).toBe('<head>\n    <base href="/client-hash/" />\n</head>');
  });

  test('writes the cloud flag and dashboard URL on cloud', () => {
    Object.assign(environment, { isOntimeCloud: true, dashboardUrl: 'https://cloud.example/$&' });
    updateRouterPrefix('client-hash');
    expect(readIndex()).toBe(
      '<head>\n    <base href="/client-hash/" data-is-cloud data-dashboard-url="https://cloud.example/$&amp;"/>\n</head>',
    );
  });
});
