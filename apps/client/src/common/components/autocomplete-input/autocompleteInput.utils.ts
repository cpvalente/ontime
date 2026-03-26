export function getScrollParent(node: HTMLElement | null): HTMLElement | Window {
  let parent = node?.parentElement ?? null;

  while (parent) {
    const { overflowY } = window.getComputedStyle(parent);
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return parent;
    }

    parent = parent.parentElement;
  }

  return window;
}
