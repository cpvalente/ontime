// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import FinderPlacement from '../FinderPlacement';

vi.mock('../../../../views/editor/finder/Finder', () => ({ default: () => <div data-testid='finder' /> }));
vi.mock('../../../app-settings/useAppSettingsNavigation', () => ({ default: () => ({ isOpen: isSettingsOpen }) }));

let isSettingsOpen: boolean;
let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

async function renderAndPressFind() {
  await act(async () => root.render(<FinderPlacement />));
  await act(async () => {
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', ctrlKey: true, bubbles: true }));
  });
  return container.querySelector('[data-testid="finder"]');
}

it('opens the finder on mod + f', async () => {
  isSettingsOpen = false;
  expect(await renderAndPressFind()).not.toBeNull();
});

it('keeps the finder closed behind the settings', async () => {
  isSettingsOpen = true;
  expect(await renderAndPressFind()).toBeNull();
});
