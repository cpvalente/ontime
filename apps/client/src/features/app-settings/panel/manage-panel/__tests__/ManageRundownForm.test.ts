// @vitest-environment happy-dom
import { act, createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ManageRundownForm } from '../ManageRundownForm';

// The remote create mutation is the outbound boundary; everything else (form, validation,
// Button, Input, Modal) is the real component under test.
const mocks = vi.hoisted(() => ({ create: vi.fn<(title: string) => Promise<void>>() }));

vi.mock('../../../../../common/hooks-query/useProjectRundowns', () => ({
  useMutateProjectRundowns: () => ({ create: mocks.create }),
}));

const ALPHANUMERIC_ERROR = 'Title can only contain alphanumeric characters, spaces and underscores';

describe('ManageRundownForm', () => {
  let root: Root | undefined;
  let onClose: ReturnType<typeof vi.fn>;

  async function render() {
    onClose = vi.fn();
    root = createRoot(document.createElement('div'));
    // react-hook-form runs an initial async validity pass on mount; settle it before typing
    // so the test does not race the mounting form state.
    await act(async () => {
      root?.render(createElement(ManageRundownForm, { onClose }));
    });
  }

  async function typeTitle(value: string) {
    const input = document.body.querySelector('input');
    if (!(input instanceof HTMLInputElement)) throw new Error('title input not rendered');
    // React tracks the native value; use the prototype setter so the change is observed.
    const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    await act(async () => {
      setValue.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  function createButton() {
    return [...document.body.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Create rundown'),
    );
  }

  async function submitForm() {
    const form = document.body.querySelector('form');
    if (!form) throw new Error('form not rendered');
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
  }

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  });

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
      root = undefined;
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('rejects a hyphenated title with a visible error and does not create the rundown', async () => {
    await render();

    await typeTitle('my-rundown');

    expect(document.body.textContent).toContain(ALPHANUMERIC_ERROR);
    expect(createButton()?.disabled).toBe(true);

    await submitForm();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('creates a rundown with a valid title unchanged', async () => {
    await render();

    await typeTitle('Morning Show');
    expect(createButton()?.disabled).toBe(false);

    await submitForm();
    expect(mocks.create).toHaveBeenCalledWith('Morning Show');
    expect(onClose).toHaveBeenCalled();
  });

  it('still falls back to "untitled" when the title is blank', async () => {
    await render();

    await submitForm();
    expect(mocks.create).toHaveBeenCalledWith('untitled');
  });
});
