// @vitest-environment happy-dom
import { OntimeView, URLPreset } from 'ontime-types';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { ViewParamsPresets } from '../ViewParamsPresets';

const preset: URLPreset = {
  enabled: true,
  alias: 'stage',
  target: OntimeView.Timer,
  search: 'hideClock=true',
  displayInNav: false,
};

vi.mock('../../../hooks-query/useUrlPresets', () => ({
  useViewUrlPresets: () => ({ viewPresets: [preset] }),
}));

let search = '';
function LocationProbe() {
  search = useLocation().search;
  return null;
}

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

async function renderAt(url: string) {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={[url]}>
        <ViewParamsPresets target={OntimeView.Timer} />
        <LocationProbe />
      </MemoryRouter>,
    ),
  );
}

function getApplyButton() {
  const button = Array.from(container.querySelectorAll('button')).find((element) => element.textContent === 'Apply');
  if (!button) throw new Error('Apply button not found');
  return button;
}

it('applies a preset while keeping the access token and navigation lock', async () => {
  await renderAt('/timer?token=secret&n=1&showLeadingZeros=true');

  await act(async () => getApplyButton().click());

  const params = new URLSearchParams(search);
  expect(params.get('hideClock')).toBe('true');
  expect(params.get('alias')).toBe('stage');
  expect(params.get('token')).toBe('secret');
  expect(params.get('n')).toBe('1');
  expect(params.has('showLeadingZeros')).toBe(false);
});

it('marks the applied preset as current', async () => {
  await renderAt('/timer?alias=stage&hideClock=true');

  expect(container.textContent).toContain('Current');
  expect(container.textContent).not.toContain('Apply');
});
