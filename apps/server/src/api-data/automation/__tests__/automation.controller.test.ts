import type { Request, Response } from 'express';
import type { Automation, ErrorResponse } from 'ontime-types';

import { editAutomation, postAutomation } from '../automation.controller.js';
import * as automationDao from '../automation.dao.js';

vi.mock('../automation.dao.js', () => ({
  addAutomation: vi.fn(),
  editAutomation: vi.fn(),
}));

function makeResponse() {
  return {
    send: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as unknown as Response<Automation | ErrorResponse>;
}

const requestBody = {
  title: 'OSC definition',
  filterRule: 'all',
  filters: [],
  outputs: [{ type: 'osc', targetIP: ' 127.0.0.1 ', targetPort: 53000, address: '/test', args: '' }],
};

describe('automation controllers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(automationDao.addAutomation).mockImplementation(async (automation) => ({ id: 'new-id', ...automation }));
    vi.mocked(automationDao.editAutomation).mockImplementation(async (id, automation) => ({ id, ...automation }));
  });

  it('persists normalized outputs when creating an automation', async () => {
    const request = { body: requestBody } as Request;

    await postAutomation(request, makeResponse());

    expect(automationDao.addAutomation).toHaveBeenCalledWith(
      expect.objectContaining({ outputs: [expect.objectContaining({ targetIP: '127.0.0.1' })] }),
    );
  });

  it('persists normalized outputs when editing an automation', async () => {
    const request = { body: requestBody, params: { id: 'automation-id' } } as unknown as Request;

    await editAutomation(request, makeResponse());

    expect(automationDao.editAutomation).toHaveBeenCalledWith(
      'automation-id',
      expect.objectContaining({ outputs: [expect.objectContaining({ targetIP: '127.0.0.1' })] }),
    );
  });

});
