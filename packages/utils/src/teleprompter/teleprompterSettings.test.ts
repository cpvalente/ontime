import { renameScriptSource } from './teleprompterSettings.js';

describe('renameScriptSource()', () => {
  test('a script source follows its custom field to a new key, and moves to the note when it is deleted', () => {
    expect(renameScriptSource('custom-Prompt', 'Prompt', 'Script')).toBe('custom-Script');
    expect(renameScriptSource('custom-Prompt', 'Prompt', null)).toBe('note');
  });

  test('a source reading anything else is left as it is', () => {
    expect(renameScriptSource('custom-Prompt', 'Other', 'Renamed')).toBe('custom-Prompt');
    expect(renameScriptSource('note', 'Other', null)).toBe('note');
  });
});
