import { useHotkeys } from '@mantine/hooks';
import { type OntimeEntry, EntryId, SupportedEntry } from 'ontime-types';

import { useEventSelection } from '../useEventSelection';

interface UseRundownKeyboardOptions {
  cursor: EntryId | null;
  commands: {
    selectEntry: (cursor: EntryId | null, direction: 'up' | 'down') => EntryId | null;
    selectGroup: (cursor: EntryId | null, direction: 'up' | 'down') => EntryId | null;
    selectEdge: (direction: 'top' | 'bottom') => EntryId | null;
    selectPage: (cursor: EntryId | null, direction: 'up' | 'down') => EntryId | null;
    cloneEntry: (cursor: EntryId | null) => void;
    moveEntry: (cursor: EntryId | null, direction: 'up' | 'down') => void;
    deleteAtCursor: (cursor: EntryId | null) => void;
    insertAtId: (patch: Partial<OntimeEntry> & { type: SupportedEntry }, id: EntryId | null, above?: boolean) => void;
    insertCopyAtId: (atId: EntryId | null, above?: boolean) => void;
  };
  clearSelectedEvents: () => void;
  setEntryCopyId: (id: EntryId | null, mode?: 'copy' | 'cut') => void;
}

export function useRundownKeyboard({
  cursor,
  commands,
  clearSelectedEvents,
  setEntryCopyId,
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
        setEntryCopyId(null);
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

    ['mod + C', () => setEntryCopyId(cursor), { preventDefault: true, usePhysicalKeys: true }],
    ['mod + X', () => setEntryCopyId(cursor, 'cut'), { preventDefault: true, usePhysicalKeys: true }],
    ['mod + V', () => commands.insertCopyAtId(cursor), { preventDefault: true, usePhysicalKeys: true }],
    ['mod + D', () => commands.cloneEntry(cursor), { preventDefault: true, usePhysicalKeys: true }],
    ['mod + shift + V', () => commands.insertCopyAtId(cursor, true), { preventDefault: true, usePhysicalKeys: true }],
  ]);
}
