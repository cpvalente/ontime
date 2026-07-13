import { completeTemplateAtCursor, matchRemaining, selectActiveTemplate } from '../templateInput.utils';

describe('matchRemaining()', () => {
  it('should return a partial string needed for autocomplete', () => {
    expect(matchRemaining('te', 'test')).toBe('st');
    expect(matchRemaining('{{{hum', '{{human}}')).toBe('an}}');
    expect(matchRemaining('send {', '{{human}}')).toBe('{human}}');

    expect(matchRemaining('{', '{{human}}')).toBe('{human}}');
    expect(matchRemaining('{{', '{{human}}')).toBe('human}}');
  });

  it('should return an empty string if there are no matches or if it is complete', () => {
    expect(matchRemaining('test', 'another')).toBe('');
    expect(matchRemaining('test', 'test')).toBe('');
  });
});

describe('selectActiveTemplate()', () => {
  it('returns the last unclosed template fragment', () => {
    expect(selectActiveTemplate('send {{event')).toBe('{{event');
    expect(selectActiveTemplate('send {{eventNow.title}} and {{event')).toBe('{{event');
  });

  it('ignores single braces and closed templates', () => {
    expect(selectActiveTemplate('send {')).toBe('');
    expect(selectActiveTemplate('send {{eventNow.title}}')).toBe('');
  });

  it('only considers templates before the cursor', () => {
    expect(selectActiveTemplate('send {{event}} then {{timer', 14)).toBe('');
    expect(selectActiveTemplate('send {{event}} then {{timer', 27)).toBe('{{timer');
  });

  it('selects a partial template when the cursor is inside a completed template', () => {
    expect(selectActiveTemplate('send {{timer.current}} after', 12)).toBe('{{timer');
  });
});

describe('completeTemplateAtCursor()', () => {
  it('completes the active template before the cursor', () => {
    expect(completeTemplateAtCursor('send {{timer after', '{{timer.current}}', 12)).toEqual({
      value: 'send {{timer.current}} after',
      cursorIndex: 22,
    });
  });

  it('preserves text before and after the cursor', () => {
    expect(completeTemplateAtCursor('before {{event after', '{{eventNow.title}}', 14)).toEqual({
      value: 'before {{eventNow.title}} after',
      cursorIndex: 25,
    });
  });

  it('preserves a following template when completing between templates', () => {
    expect(completeTemplateAtCursor('{{clock}} and {{timer then {{eventNow.title}}', '{{timer.current}}', 21)).toEqual({
      value: '{{clock}} and {{timer.current}} then {{eventNow.title}}',
      cursorIndex: 31,
    });
  });

  it('replaces the whole template when the cursor is inside a completed template', () => {
    expect(completeTemplateAtCursor('before {{timer.current}} after', '{{timer.duration}}', 15)).toEqual({
      value: 'before {{timer.duration}} after',
      cursorIndex: 25,
    });
  });
});
