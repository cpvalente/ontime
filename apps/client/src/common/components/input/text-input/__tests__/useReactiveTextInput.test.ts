import { shouldSubmitValue } from '../useReactiveTextInput';

describe('shouldSubmitValue()', () => {
  it('submits a value which differs from the initial value', () => {
    expect(shouldSubmitValue('new', 'old')).toBe(true);
  });

  it('does not submit a value which has not changed', () => {
    expect(shouldSubmitValue('same', 'same')).toBe(false);
  });

  it('submits an empty value when the initial value is known', () => {
    // clearing a field which has a value is a valid edit
    expect(shouldSubmitValue('', 'old')).toBe(true);
  });

  it('does not submit an empty value when the initial value is unknown', () => {
    // an unknown value renders as an empty field, submitting it on blur
    // would overwrite every entry being edited with an empty value
    expect(shouldSubmitValue('', undefined)).toBe(false);
  });

  it('submits a typed value when the initial value is unknown', () => {
    expect(shouldSubmitValue('typed', undefined)).toBe(true);
  });

  it('submits an unchanged value when the caller opts in', () => {
    expect(shouldSubmitValue('same', 'same', true)).toBe(true);
    expect(shouldSubmitValue('', undefined, true)).toBe(true);
  });
});
