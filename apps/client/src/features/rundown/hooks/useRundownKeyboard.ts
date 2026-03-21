import { useHotkeys } from '@mantine/hooks';
import { EntryId, type OntimeEntry, SupportedEntry } from 'ontime-types';

import { useEntryCopy } from '../../../common/stores/entryCopyStore';
import { useEventSelection } from '../useEventSelection';

interface UseRundownKeyboardOptions {
  cursor: EntryId | null;
  rundownId: string | undefined;
  selectedEvents: Set<EntryId>;
  commands: {
    selectEntry: (cursor: EntryId | null, direction: 'up' | 'down') => EntryId | null;
    selectGroup: (cursor: EntryId | null, direction: 'up' | 'down') => EntryId | null;
    selectEdge: (direction: 'top' | 'bottom') => EntryId | null;
    selectPage: (cursor: EntryId | null, direction: 'up' | 'down') => EntryId | null;
    cloneEntry: (cursor: EntryId | null) => void;
    moveEntry: (cursor: EntryId | null, direction: 'up' | 'down') => void;
    deleteAtCursor: (cursor: EntryId | null) => void;
    insertAtId: (patch: Partial<OntimeEntry> & { type: SupportedEntry }, id: EntryId | null, above?: boolean) => void;
    pasteAtCursor: (cursor: EntryId | null, above?: boolean) => void;
  };
  clearSelectedEvents: () => void;
}

/**
 * Returns true when a keyboard event target is a text input element.
 * Use this to avoid intercepting browser-native copy/cut/paste shortcuts
 * while users are typing in form fields.
 */
function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea';
}

export function useRundownKeyboard({
  cursor,
  rundownId,
  selectedEvents,
  commands,
  clearSelectedEvents,
}: UseRundownKeyboardOptions) {
  const scrollToEntry = useEventSelection((state) => state.scrollToEntry);

  useHotkeys([
    [
      'alt + ArrowDown',
      () => {
        const nextId = commands.selectEntry(cursor, 'down');
        if (nextId) {
          scrollToEntry(nextId);
        }
      },
      { preventDefault: true, usePhysicalKeys: true },
    ],
    [
      'alt + ArrowUp',
      () => {
        const nextId = commands.selectEntry(cursor, 'up');
        if (nextId) {
          scrollToEntry(nextId);
        }
      },
      { preventDefault: true, usePhysicalKeys: true },
    ],

    [
      'alt + shift + ArrowDown',
      () => {
        const nextId = commands.selectGroup(cursor, 'down');
        if (nextId) {
          scrollToEntry(nextId);
        }
      },
      { preventDefault: true, usePhysicalKeys: true },
    ],
    [
      'alt + shift + ArrowUp',
      () => {
        const nextId = commands.selectGroup(cursor, 'up');
        if (nextId) {
          scrollToEntry(nextId);
        }
      },
      { preventDefault: true, usePhysicalKeys: true },
    ],

    [
      'Home',
      () => {
        const nextId = commands.selectEdge('top');
        if (nextId) {
          scrollToEntry(nextId);
        }
      },
      { preventDefault: true, usePhysicalKeys: true },
    ],
    [
      'End',
      () => {
        const nextId = commands.selectEdge('bottom');
        if (nextId) {
          scrollToEntry(nextId);
        }
      },
      { preventDefault: true, usePhysicalKeys: true },
    ],
    [
      'PageUp',
      () => {
        const nextId = commands.selectPage(cursor, 'up');
        if (nextId) {
          scrollToEntry(nextId);
        }
      },
      { preventDefault: true, usePhysicalKeys: true },
    ],
    [
      'PageDown',
      () => {
        const nextId = commands.selectPage(cursor, 'down');
        if (nextId) {
          scrollToEntry(nextId);
        }
      },
      { preventDefault: true, usePhysicalKeys: true },
    ],

    [
      'alt + mod + ArrowDown',
      () => commands.moveEntry(cursor, 'down'),
      { preventDefault: true, usePhysicalKeys: true },
    ],
    ['alt + mod + ArrowUp', () => commands.moveEntry(cursor, 'up'), { preventDefault: true, usePhysicalKeys: true }],

    [
      'Escape',
      () => {
        clearSelectedEvents();
        useEntryCopy.getState().clearCopy();
      },
      { preventDefault: true, usePhysicalKeys: true },
    ],

    ['alt + Backspace', () => commands.deleteAtCursor(cursor), { preventDefault: true, usePhysicalKeys: true }],

    [
      'alt + E',
      () => commands.insertAtId({ type: SupportedEntry.Event }, cursor),
      { preventDefault: true, usePhysicalKeys: true },
    ],
    [
      'alt + shift + E',
      () => commands.insertAtId({ type: SupportedEntry.Event }, cursor, true),
      { preventDefault: true, usePhysicalKeys: true },
    ],

    [
      'alt + G',
      () => commands.insertAtId({ type: SupportedEntry.Group }, cursor),
      { preventDefault: true, usePhysicalKeys: true },
    ],
    [
      'alt + shift + G',
      () => commands.insertAtId({ type: SupportedEntry.Group }, cursor, true),
      { preventDefault: true, usePhysicalKeys: true },
    ],

    [
      'alt + D',
      () => commands.insertAtId({ type: SupportedEntry.Delay }, cursor),
      { preventDefault: true, usePhysicalKeys: true },
    ],
    [
      'alt + shift + D',
      () => commands.insertAtId({ type: SupportedEntry.Delay }, cursor, true),
      { preventDefault: true, usePhysicalKeys: true },
    ],

    [
      'alt + M',
      () => commands.insertAtId({ type: SupportedEntry.Milestone }, cursor),
      { preventDefault: true, usePhysicalKeys: true },
    ],
    [
      'alt + shift + M',
      () => commands.insertAtId({ type: SupportedEntry.Milestone }, cursor, true),
      { preventDefault: true, usePhysicalKeys: true },
    ],

    [
      'mod + C',
      (event) => {
        if (cursor === null || isEditableElement(event.target) || !rundownId) {
          return;
        }
        event.preventDefault();

        // if multiple events are selected, copy all of them; otherwise copy the cursor entry
        const ids = selectedEvents.size > 1 ? Array.from(selectedEvents) : [cursor];
        useEntryCopy.getState().setCopyEntries(ids, rundownId);
      },
      { usePhysicalKeys: true },
    ],
    [
      'mod + V',
      (event) => {
        if (isEditableElement(event.target) || useEntryCopy.getState().entryIds.size === 0) {
          return;
        }
        event.preventDefault();
        commands.pasteAtCursor(cursor);
      },
      { usePhysicalKeys: true },
    ],
    ['mod + D', () => commands.cloneEntry(cursor), { preventDefault: true, usePhysicalKeys: true }],
    [
      'mod + shift + V',
      (event) => {
        if (isEditableElement(event.target) || useEntryCopy.getState().entryIds.size === 0) {
          return;
        }
        event.preventDefault();
        commands.pasteAtCursor(cursor, true);
      },
      { usePhysicalKeys: true },
    ],
  ]);
}
