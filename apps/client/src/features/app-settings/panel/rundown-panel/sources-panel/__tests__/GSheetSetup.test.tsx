// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { getWorksheetOptions, verifyAuthenticationStatus } from '../../../../../../common/api/sheets';
import GSheetSetup from '../GSheetSetup';

vi.mock('../../../../../../common/api/sheets', () => ({
  getWorksheetOptions: vi.fn(),
  verifyAuthenticationStatus: vi.fn(),
  requestConnection: vi.fn(),
  revokeAuthentication: vi.fn(),
}));

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.resetAllMocks();
  container = document.createElement('div');
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

it.each(['initial load', 'manual load'])(
  'shows the connection form after the session expires during %s',
  async (flow) => {
    vi.mocked(verifyAuthenticationStatus)
      .mockResolvedValueOnce({ authenticated: 'authenticated', sheetId: flow === 'initial load' ? 'sheet-id' : '' })
      .mockResolvedValueOnce({ authenticated: 'not_authenticated', sheetId: '' });
    vi.mocked(getWorksheetOptions).mockRejectedValueOnce(new Error('Connect to Google Sheets first.'));

    await act(async () => {
      root.render(<GSheetSetup onCancel={vi.fn()} onSheetLoaded={vi.fn()} closedByUser={false} />);
    });

    if (flow === 'manual load') {
      expect(container.textContent).toContain('Connected');
      const input = container.querySelector<HTMLInputElement>("input[placeholder='Sheet ID or Google Sheets URL']")!;
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'sheet-id');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await act(async () => {
        const loadButton = Array.from(container.querySelectorAll('button')).find(
          (button) => button.textContent === 'Load sheet',
        );
        loadButton!.click();
      });
    }

    expect(container.textContent).toContain('Not connected');
    expect(container.querySelector('input[type="file"]')).not.toBeNull();
    expect(container.textContent).toContain('Connect to Google Sheets first.');
  },
);
