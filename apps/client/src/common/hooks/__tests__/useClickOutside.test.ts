import { act, renderHook } from '@testing-library/react';

import useClickOutside from '../useClickOutside';

describe('useClickOutside', () => {
  let target: HTMLElement;
  let anotherElement: HTMLElement;

  beforeAll(() => {
    target = global.document.createElement('div');
    global.document.body.appendChild(target);

    anotherElement = global.document.createElement('div');
    global.document.body.appendChild(anotherElement);
  });

  it('should trigger clicking outside', () => {
    const ref = { current: target };
    const callback = vi.fn();
    renderHook(() => useClickOutside(ref, callback));

    act(() => {
      global.document.dispatchEvent(new Event('click'));
    });

    expect(callback).toHaveBeenCalled();

    act(() => {
      anotherElement.click();
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should not trigger clicking inside', () => {
    const ref = { current: target };
    const callback = vi.fn();
    renderHook(() => useClickOutside(ref, callback));

    act(() => {
      target.click();
    });

    expect(callback).not.toHaveBeenCalled();
  });
});
