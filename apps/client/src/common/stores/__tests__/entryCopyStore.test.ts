import { isEntryInClipboard } from '../entryCopyStore';

describe('isEntryInClipboard()', () => {
  const clipboard = { sourceRundownId: 'rundown', entryIds: ['1', '2'], mode: 'cut' as const };

  it('marks every entry on the clipboard', () => {
    expect(isEntryInClipboard(clipboard, 'rundown', '1')).toBe(true);
    expect(isEntryInClipboard(clipboard, 'rundown', '2')).toBe(true);
    expect(isEntryInClipboard(clipboard, 'rundown', '3')).toBe(false);
  });

  it('does not mark an entry with the same id in another rundown', () => {
    expect(isEntryInClipboard(clipboard, 'duplicate', '1')).toBe(false);
  });

  it('marks nothing on an empty clipboard', () => {
    expect(isEntryInClipboard(null, 'rundown', '1')).toBe(false);
  });
});
