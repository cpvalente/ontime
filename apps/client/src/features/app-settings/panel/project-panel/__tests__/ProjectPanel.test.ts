import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { useEditorSettings } from '../../../../../common/stores/editorSettings';
import ProjectPanel from '../ProjectPanel';

vi.mock('../ManageProjects', () => ({ default: () => null }));

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

it('discards staged thresholds when project creation is cancelled', async () => {
  const savedSettings = useEditorSettings.getState();
  const setLocation = vi.fn();
  const renderPanel = async (location?: string) => {
    await act(async () => root.render(createElement(ProjectPanel, { location, setLocation })));
  };
  const getTimeInput = (name: string) =>
    document.querySelector<HTMLInputElement>(`[data-testid="time-input-${name}"]`)!;

  await renderPanel('create');
  const originalWarnTime = getTimeInput('warnTime').value;
  const originalDangerTime = getTimeInput('dangerTime').value;
  for (const name of ['warnTime', 'dangerTime']) {
    const input = getTimeInput(name);
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '00:07:00');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    });
    expect(input.value).toBe('00:07:00');
  }
  const cancel = Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Cancel')!;
  await act(async () => cancel.click());
  expect(setLocation).toHaveBeenCalledWith('project');
  await renderPanel();
  await renderPanel('create');

  expect(getTimeInput('warnTime').value).toBe(originalWarnTime);
  expect(getTimeInput('dangerTime').value).toBe(originalDangerTime);
  expect(useEditorSettings.getState().defaultWarnTime).toBe(savedSettings.defaultWarnTime);
  expect(useEditorSettings.getState().defaultDangerTime).toBe(savedSettings.defaultDangerTime);
});
