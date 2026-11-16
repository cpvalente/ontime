// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router';

import AppLink from '../AppLink';

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

function CurrentSearch() {
  return <output>{useLocation().search}</output>;
}

it('opens the settings and keeps the editor layout', async () => {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/editor?layout=planning']}>
        <AppLink search='settings=manage__custom'>Manage Custom Fields</AppLink>
        <CurrentSearch />
      </MemoryRouter>,
    ),
  );

  await act(async () => container.querySelector('button')?.click());

  expect(container.querySelector('output')?.textContent).toBe('?layout=planning&settings=manage__custom');
});
