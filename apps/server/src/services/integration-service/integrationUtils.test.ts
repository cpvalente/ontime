import { parseTemplateNested } from './integrationUtils.js';

describe('parseTemplateNested()', () => {
  it('parses string with a single-level variable name', () => {
    const store = { timer: 10 };
    const templateString = '/test/{{timer}}';
    const result = parseTemplateNested(templateString, store);
    expect(result).toEqual('/test/10');
  });

  it('parses string with a nested variable name', () => {
    const store = { timer: { clock: 10 } };
    const templateString = '/timer/{{timer.clock}}';
    const result = parseTemplateNested(templateString, store);
    expect(result).toEqual('/timer/10');
  });

  it('parses string with multiple variables', () => {
    const mockState = { test1: 'that', test2: 'this' };
    const testString = '{{test1}} should replace {{test2}}';
    const expected = `${mockState.test1} should replace ${mockState.test2}`;

    const result = parseTemplateNested(testString, mockState);
    expect(result).toStrictEqual(expected);
  });

  it('correctly parses a string without templates', () => {
    const testString = 'That should replace {test}';

    const result = parseTemplateNested(testString, {});
    expect(result).toStrictEqual(testString);
  });

  it('handles scenarios with missing variables', () => {
    // by failing to provide a value, we give visibility to
    // potential issues in the given string
    const mockState = { test1: 'that', test2: 'this' };
    const testString = '{{test1}} should replace {{test2}}, but not {{test3}}';
    const expected = `${mockState.test1} should replace ${mockState.test2}, but not {{test3}}`;

    const result = parseTemplateNested(testString, mockState);
    expect(result).toStrictEqual(expected);
  });
});
