// @vitest-environment happy-dom
import { OntimeView } from 'ontime-types';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { OptionTitle } from '../constants';
import type { ViewOption } from '../viewParams.types';
import ViewParamsEditor from '../ViewParamsEditor';
import { useViewParamsEditorStore } from '../viewParamsEditor.store';

vi.mock('../../../hooks-query/useViewSettings', () => ({
  default: () => ({ data: { overrideStyles: false } }),
}));
vi.mock('../../../hooks-query/useUrlPresets', () => ({
  useViewUrlPresets: () => ({ viewPresets: [] }),
}));
vi.mock('../../../hooks/useIsSmallScreen', () => ({ useIsSmallScreen: () => false }));

const viewOptions: ViewOption[] = [
  {
    title: OptionTitle.ElementVisibility,
    options: [{ id: 'hideClock', title: 'Hide clock', type: 'boolean', defaultValue: false }],
  },
];

let search = '';
function LocationProbe() {
  search = useLocation().search;
  return null;
}

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  useViewParamsEditorStore.getState().open();
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/timer?alias=stage&token=secret&n=1&hideClock=true']}>
        <ViewParamsEditor target={OntimeView.Timer} viewOptions={viewOptions} />
        <LocationProbe />
      </MemoryRouter>,
    ),
  );
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  useViewParamsEditorStore.getState().close();
  vi.unstubAllGlobals();
});

function getButton(name: string) {
  const button = Array.from(document.querySelectorAll('button')).find((element) => element.textContent === name);
  if (!button) throw new Error(`${name} button not found`);
  return button;
}

it('drops the preset alias but keeps reserved params on apply', async () => {
  await act(async () => getButton('Apply').click());

  const params = new URLSearchParams(search);
  expect(params.has('alias')).toBe(false);
  expect(params.get('token')).toBe('secret');
  expect(params.get('n')).toBe('1');
});

it('drops the preset alias but keeps reserved params on reset', async () => {
  await act(async () => getButton('Reset to default').click());

  const params = new URLSearchParams(search);
  expect(params.has('alias')).toBe(false);
  expect(params.has('hideClock')).toBe(false);
  expect(params.get('token')).toBe('secret');
  expect(params.get('n')).toBe('1');
});
