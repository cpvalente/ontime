import { useHotkeys } from '@mantine/hooks';
import { type OntimeEntry, EntryId, SupportedEntry } from 'ontime-types';

interface UseRundownKeyboardOptions {
  cursor: EntryId | null;
  commands: {
    selectEntry: (cursor: EntryId | null, direction: 'up' | 'down') => void;
    selectGroup: (cursor: EntryId | null, direction: 'up' | 'down') => void;
    moveEntry: (cursor: EntryId | null, direction: 'up' | 'down') => void;
    deleteAtCursor: (cursor: EntryId | null) => void;
    insertAtId: (patch: Partial<OntimeEntry> & { type: SupportedEntry }, id: EntryId | null, above?: boolean) => void;
    insertCopyAtId: (atId: EntryId | null, above?: boolean) => void;
  };
  clearSelectedEvents: () => void;
  setEntryCopyId: (id: EntryId | null) => void;
}

export function useRundownKeyboard({
  cursor,
  commands,
  clearSelectedEvents,
  setEntryCopyId,
}: UseRundownKeyboardOptions) {
  useHotkeys([
    ['alt + ArrowDown', () => commands.selectEntry(cursor, 'down'), { preventDefault: true, usePhysicalKeys: true }],
    ['alt + ArrowUp', () => commands.selectEntry(cursor, 'up'), { preventDefault: true, usePhysicalKeys: true }],

    [
      'alt + shift + ArrowDown',
      () => commands.selectGroup(cursor, 'down'),
      { preventDefault: true, usePhysicalKeys: true },
    ],
    [
      'alt + shift + ArrowUp',
      () => commands.selectGroup(cursor, 'up'),
      { preventDefault: true, usePhysicalKeys: true },
    ],

    [
      'alt + mod + ArrowDown',
      () => commands.moveEntry(cursor, 'down'),
      { preventDefault: true, usePhysicalKeys: true },
    ],
    ['alt + mod + ArrowUp', () => commands.moveEntry(cursor, 'up'), { preventDefault: true, usePhysicalKeys: true }],

    ['Escape', () => clearSelectedEvents(), { preventDefault: true, usePhysicalKeys: true }],

    ['mod + Backspace', () => commands.deleteAtCursor(cursor), { preventDefault: true, usePhysicalKeys: true }],

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

    ['mod + C', () => setEntryCopyId(cursor)],
    ['mod + V', () => commands.insertCopyAtId(cursor)],
    ['mod + shift + V', () => commands.insertCopyAtId(cursor, true), { preventDefault: true, usePhysicalKeys: true }],

    ['alt + backspace', () => commands.deleteAtCursor(cursor), { preventDefault: true, usePhysicalKeys: true }],
  ]);
}
