// @vitest-environment happy-dom
import { act, type PropsWithChildren, Suspense } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router';

import Editor from '../Editor';
import { EditorLayoutMode } from '../useEditorLayout';

vi.mock('../../../features/rundown/RundownExport', () => ({ default: () => <div data-testid='rundown' /> }));
vi.mock('../../../features/control/playback/TimerControlExport', () => ({
  default: () => <button data-testid='playback' />,
}));
vi.mock('../../../features/control/playback/tracking-playback-bar/TrackingPlaybackBar', () => ({
  default: () => <button data-testid='playback' />,
}));
vi.mock('../../../features/control/message/MessageControlExport', () => ({ default: () => null }));
vi.mock('../title-list/TitleList', () => ({ default: () => null }));
vi.mock('../../../common/context/RundownScopeContext', () => ({
  RundownScopeProvider: ({ children }: PropsWithChildren) => children,
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

async function render(layout: EditorLayoutMode, isSettingsOpen: boolean) {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={[`/editor?layout=${layout}`]}>
        <Suspense>
          <Editor isSettingsOpen={isSettingsOpen} />
        </Suspense>
      </MemoryRouter>,
    ),
  );
}

describe.each(Object.values(EditorLayoutMode))('settings over the %s layout', (layout) => {
  it('hides the whole editor, playback included, while the settings are open', async () => {
    await render(layout, true);
    const panels = container.querySelector('#panels');
    const rendered = [...container.querySelectorAll('[data-testid]')];
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.every((element) => panels?.contains(element))).toBe(true);
    expect(panels?.hasAttribute('inert')).toBe(true);
    expect(panels?.className).toMatch(/hidden/);

    await render(layout, false);
    expect(panels?.hasAttribute('inert')).toBe(false);
    expect(panels?.className).not.toMatch(/hidden/);
  });
});
