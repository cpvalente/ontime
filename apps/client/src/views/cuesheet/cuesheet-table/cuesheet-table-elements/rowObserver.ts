import { useVisibleRowsStore } from './visibleRowsStore';

let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (!observer) {
    const { addVisibleRow, removeVisibleRow } = useVisibleRowsStore.getState();

    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '400px 0px', // prevent unmounting rows too early
      threshold: 0.01,
    };

    const handleOnIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        const targetId = entry.target.id;
        if (entry.isIntersecting) {
          addVisibleRow(targetId);
        } else {
          removeVisibleRow(targetId);
        }
      });
    };

    observer = new IntersectionObserver(handleOnIntersect, options);
  }

  return observer;
}

/**
 * register a row element in the observer
 */
export function observeRow(element: HTMLElement) {
  getObserver().observe(element);
}

/**
 * unregister a row element in the observer
 */
export function unobserveRow(element: HTMLElement) {
  getObserver().unobserve(element);
}

/**
 * cleanup observer, should be called when the table component unmounts
 */
export function cleanup() {
  observer?.disconnect();
  observer = null;
}
