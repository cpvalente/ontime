// @vitest-environment happy-dom
import { act, type PropsWithChildren, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router';

import ProtectedEditor from '../ProtectedEditor';

vi.mock('../../../common/components/protect-route/ProtectRoute', () => ({
  default: ({ children }: PropsWithChildren) => children,
}));
vi.mock('../../../features/overview/EditorOverview', () => ({
  default: ({ children }: PropsWithChildren) => children,
}));
vi.mock('../../../common/components/navigation-menu/NavigationMenu', () => ({ default: () => null }));
vi.mock('../welcome/WelcomePlacement', () => ({ default: () => null }));
vi.mock('../EditorLayoutOptions', () => ({ default: () => null }));
// an editor with local state, which is lost if the settings unmount it
vi.mock('../Editor', () => ({
  default: function Editor({ isSettingsOpen }: { isSettingsOpen: boolean }) {
    const [clicks, setClicks] = useState(0);
    return (
      <button data-testid='editor' data-settings-open={isSettingsOpen} onClick={() => setClicks((count) => count + 1)}>
        {clicks}
      </button>
    );
  },
}));
// like the settings, it takes focus when it opens
vi.mock('../../../features/app-settings/AppSettings', () => ({
  default: () => <input aria-label='Search settings' autoFocus />,
}));

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

async function render() {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/editor?layout=planning']}>
        <ProtectedEditor />
      </MemoryRouter>,
    ),
  );
}

function byTestId(testId: string) {
  return container.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
}

function settingsToggle() {
  return container.querySelector<HTMLButtonElement>('[aria-label="Toggle settings"]');
}

it('keeps the editor and its state while the settings open and close', async () => {
  await render();
  await act(async () => byTestId('editor')?.click());

  await act(async () => settingsToggle()?.click());
  expect(byTestId('editor')?.textContent).toBe('1');
  expect(byTestId('editor')?.dataset.settingsOpen).toBe('true');

  await act(async () => settingsToggle()?.click());
  expect(byTestId('editor')?.textContent).toBe('1');
  expect(byTestId('editor')?.dataset.settingsOpen).toBe('false');
});

it('returns focus to the settings toggle when the settings close', async () => {
  await render();
  const toggle = settingsToggle();

  await act(async () => toggle?.click());
  expect(document.activeElement?.getAttribute('aria-label')).toBe('Search settings');

  await act(async () => toggle?.click());
  expect(document.activeElement).toBe(toggle);
});
