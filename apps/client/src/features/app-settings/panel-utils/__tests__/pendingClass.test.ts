import { describe, expect, it } from 'vitest';

import { pendingClass } from '../PanelUtils';

describe('pendingClass', () => {
  it.each([true, { unit: false, value: true }, [undefined, true], { a: { b: true } }])(
    'marks a changed field %j',
    (dirty) => {
      expect(pendingClass(dirty)).toBeTypeOf('string');
    },
  );

  it.each([undefined, false, {}, { unit: false }, [undefined, false]])('leaves an unchanged field %j', (dirty) => {
    expect(pendingClass(dirty)).toBeUndefined();
  });
});
