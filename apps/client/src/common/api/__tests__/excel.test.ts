import axios, { AxiosError, AxiosHeaders } from 'axios';
import { vi } from 'vitest';

import { downloadAllAsExcel, downloadAsExcel } from '../excel';
import { maybeAxiosError } from '../utils';

it.each([downloadAllAsExcel, () => downloadAsExcel('rundown-id')])(
  'preserves server error details from a failed workbook download',
  async (download) => {
    const error = new AxiosError('Request failed', undefined, undefined, undefined, {
      data: new Blob([JSON.stringify({ message: 'Cannot export an empty project' })]),
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    });
    const request = vi.spyOn(axios, 'get').mockRejectedValueOnce(error);
    try {
      await expect(download()).rejects.toBe(error);
      expect(maybeAxiosError(error)).toContain('Cannot export an empty project');
    } finally {
      request.mockRestore();
    }
  },
);
