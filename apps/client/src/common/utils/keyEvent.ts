import { KeyboardEvent } from 'react';

export function isKeyEnter<T>(event: KeyboardEvent<T>): boolean {
  return event.key === 'Enter';
}

export function isKeyEscape<T>(event: KeyboardEvent<T>): boolean {
  return event.key === 'Escape';
}
