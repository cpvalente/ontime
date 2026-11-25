import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TimerLifeCycle } from 'ontime-types';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { addAutomation, addTrigger, editAutomation, testOutput } from '../../../../../common/api/automation';
import { CUSTOM_FIELDS } from '../../../../../common/api/constants';
import AutomationForm from '../AutomationForm';

vi.mock('../../../../../common/api/automation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../../common/api/automation')>()),
  testOutput: vi.fn(),
  addAutomation: vi.fn(),
  addTrigger: vi.fn(),
  editAutomation: vi.fn(),
}));

vi.mock('../../../../../common/hooks-query/useAutomationSettings', () => ({
  default: () => ({ refetch: vi.fn() }),
}));

describe('AutomationForm output tests', () => {
  let root: Root;
  let container: HTMLDivElement;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
    queryClient.setQueryData(CUSTOM_FIELDS, []);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    queryClient.clear();
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  it('keeps an edited output busy until its test finishes, then only shows feedback for the tested input', async () => {
    const pending = Promise.withResolvers<void>();
    vi.mocked(testOutput).mockReturnValueOnce(pending.promise).mockResolvedValueOnce(undefined);
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client: queryClient },
          createElement(AutomationForm, {
            automation: {
              title: 'HTTP output',
              filterRule: 'all',
              filters: [],
              outputs: [{ type: 'http', url: 'http://localhost/first' }],
            },
            onClose: vi.fn(),
          }),
        ),
      );
    });
    const testButton = Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Test')!;
    const urlInput = document.querySelector<HTMLInputElement>('input[name="outputs.0.url"]')!;
    await act(async () => testButton.click());
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
        urlInput,
        'http://localhost/second',
      );
      urlInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(urlInput.value).toBe('http://localhost/second');
    expect(testButton.disabled).toBe(true);
    await act(async () => testButton.click());
    expect(testOutput).toHaveBeenCalledTimes(1);

    await act(async () => pending.resolve());
    expect(testButton.disabled).toBe(false);
    expect(document.body.textContent).not.toContain('Request sent');

    await act(async () => testButton.click());
    expect(testOutput).toHaveBeenLastCalledWith({ type: 'http', url: 'http://localhost/second' });
    expect(document.body.textContent).toContain('Request sent');
  });

  it('saves an untouched recipe with its global trigger, and retries without creating the automation twice', async () => {
    const recipe = {
      title: 'QLab: GO',
      filterRule: 'all' as const,
      filters: [],
      outputs: [{ type: 'osc' as const, targetIP: '127.0.0.1', targetPort: 53000, address: '/go', args: '' }],
    };
    const onClose = vi.fn();
    vi.mocked(addAutomation).mockResolvedValue({ id: 'new', ...recipe });
    vi.mocked(addTrigger).mockRejectedValueOnce(new Error('Network down'));

    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client: queryClient },
          createElement(AutomationForm, { automation: recipe, trigger: TimerLifeCycle.onStart, onClose }),
        ),
      );
    });
    const saveButton = Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Save')!;
    expect(saveButton.disabled).toBe(false);

    await act(async () => saveButton.click());
    expect(onClose).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('Network down');

    await act(async () => saveButton.click());
    expect(addAutomation).toHaveBeenCalledTimes(1);
    expect(editAutomation).toHaveBeenCalledWith('new', { id: 'new', ...recipe });
    expect(addTrigger).toHaveBeenLastCalledWith({
      title: 'QLab: GO',
      trigger: TimerLifeCycle.onStart,
      automationId: 'new',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps an existing automation unsaveable until it is edited, without offering a global trigger', async () => {
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client: queryClient },
          createElement(AutomationForm, {
            automation: { id: 'existing', title: 'QLab: GO', filterRule: 'all', filters: [], outputs: [] },
            onClose: vi.fn(),
          }),
        ),
      );
    });
    const saveButton = Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Save')!;
    expect(saveButton.disabled).toBe(true);
    expect(document.body.textContent).not.toContain('Also run automatically on');
  });
});
