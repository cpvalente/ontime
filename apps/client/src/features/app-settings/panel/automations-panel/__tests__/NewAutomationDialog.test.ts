import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { addAutomation, addTrigger } from '../../../../../common/api/automation';
import { AUTOMATION } from '../../../../../common/api/constants';
import { automationPlaceholderSettings } from '../../../../../common/models/AutomationSettings';
import NewAutomationDialog from '../NewAutomationDialog';

vi.mock('../../../../../common/api/automation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../../common/api/automation')>()),
  addAutomation: vi.fn(),
  addTrigger: vi.fn(),
}));

describe('NewAutomationDialog', () => {
  let root: Root;
  let container: HTMLDivElement;
  let queryClient: QueryClient;

  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    // jsdom has no web animations, which the scroll area reads to settle its scrollbars
    Element.prototype.getAnimations ??= () => [];
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
    queryClient.setQueryData(AUTOMATION, automationPlaceholderSettings);
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client: queryClient },
          createElement(NewAutomationDialog, { onClose: vi.fn(), onCreated: vi.fn() }),
        ),
      );
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    queryClient.clear();
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  const buttons = () => Array.from(document.querySelectorAll('button'));
  const button = (text: string) => buttons().find((candidate) => candidate.textContent?.trim() === text)!;
  const recipeTitleOf = (candidate: HTMLButtonElement) =>
    candidate.querySelector('[class*="recipeTitle"]')?.textContent ?? null;
  const recipeTitles = () =>
    buttons()
      .map(recipeTitleOf)
      .filter((title) => title !== null);
  /** recipe rows carry their description and tags too, so they are found by their title alone */
  const recipe = (title: string) => buttons().find((candidate) => recipeTitleOf(candidate) === title)!;

  function type(input: HTMLInputElement, value: string) {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  it('narrows the list to one software, and keeps the filter when coming back', async () => {
    await act(async () => button('QLab').click());

    expect(button('QLab').getAttribute('aria-pressed')).toBe('true');
    expect(recipeTitles().length).toBeGreaterThan(0);
    expect(recipeTitles().every((title) => title?.startsWith('QLab'))).toBe(true);

    await act(async () => recipe('QLab — press GO').click());
    await act(async () => button('All recipes').click());

    expect(button('QLab').getAttribute('aria-pressed')).toBe('true');
  });

  it('creates the automation and its triggers under the title the user typed', async () => {
    vi.mocked(addAutomation).mockResolvedValue({
      id: 'created',
      title: 'Doors warning',
      filterRule: 'all',
      filters: [],
      outputs: [],
    });

    await act(async () => recipe('Warn the stage when time runs low').click());
    const titleInput = document.querySelector<HTMLInputElement>('input[placeholder="Automation title"]')!;
    expect(titleInput.value).toBe('Warn the stage at danger');

    await act(async () => type(titleInput, 'Doors warning'));
    await act(async () => button('Create automation').click());

    expect(addAutomation).toHaveBeenCalledWith(expect.objectContaining({ title: 'Doors warning' }));
    expect(addTrigger).toHaveBeenCalledWith(
      expect.objectContaining({ automationId: 'created', title: expect.stringContaining('Doors warning') }),
    );
  });

  it('will not create an automation without a title', async () => {
    await act(async () => recipe('Hide the stage message on finish').click());
    const titleInput = document.querySelector<HTMLInputElement>('input[placeholder="Automation title"]')!;

    await act(async () => type(titleInput, '   '));

    expect(button('Create automation').disabled).toBe(true);
  });
});
