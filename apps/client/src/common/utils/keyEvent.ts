import { KeyboardEvent } from 'react';

export function isKeyEnter<T>(event: KeyboardEvent<T>): boolean {
  return event.key === 'Enter';
}

export function isKeyEscape<T>(event: KeyboardEvent<T>): boolean {
  return event.key === 'Escape';
}

export function preventEscape<T>(event: KeyboardEvent<T>, callback?: () => void): void {
  if (isKeyEscape(event)) {
    event.preventDefault();
    event.stopPropagation();
    callback?.();
  }
}
