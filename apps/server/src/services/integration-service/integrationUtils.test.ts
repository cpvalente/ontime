import { stringToOSCArgs } from '../../utils/oscArgParser.js';
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

describe('parseNestedTemplate() -> resolveAliasData()', () => {
  it('resolves data through callback', () => {
    const data = {
      not: {
        so: {
          easy: '3',
        },
      },
    };
    const aliases = {
      easy: { key: 'not.so.easy', cb: (value: string) => `testing-${value}` },
    };

    const easyParse = parseTemplateNested('{{human.easy}}', data, aliases);
    expect(easyParse).toBe('testing-3');
  });
  it('handles a mixed operation', () => {
    const data = {
      not: {
        so: {
          easy: '3',
        },
      },
      other: {
        value: 42,
      },
    };
    const aliases = {
      easy: { key: 'not.so.easy', cb: (value: string) => `testing-${value}` },
    };

    const easyParse = parseTemplateNested('{{other.value}} to {{human.easy}}', data, aliases);
    expect(easyParse).toBe('42 to testing-3');
  });
  it('returns given key when not found', () => {
    const data = {
      not: {
        so: {
          easy: '3',
        },
      },
      other: {
        value: 5,
      },
    };
    const aliases = {
      easy: { key: 'not.so.easy', cb: (value: string) => `testing-${value}` },
    };

    const easyParse = parseTemplateNested('{{other.value}} to {{human.easy}} {{human.not.found}}', data, aliases);
    expect(easyParse).toBe('5 to testing-3 {{human.not.found}}');
  });
});

describe('parseNestedTemplate() -> stringToOSCArgs()', () => {
  it.only('specific osc requirements', () => {
    const data = {
      not: {
        so: {
          easy: 'data with space',
          empty: '',
          number: 1234,
          stringNumber: '1234',
        },
      },
    };

    const payloads = [
      {
        test: '"string with space and {{not.so.easy}}"',
        expect: [{ type: 'string', value: 'string with space and data with space' }],
      },
      {
        test: '',
        expect: [],
      },
      {
        test: ' ',
        expect: [],
      },
      {
        test: '""',
        expect: [{ type: 'string', value: '' }],
      },
      {
        test: '"string with space and {{not.so.empty}}"',
        expect: [{ type: 'string', value: 'string with space and ' }],
      },
      {
        test: '"string with space and {{not.so.number}}"',
        expect: [{ type: 'string', value: 'string with space and 1234' }],
      },
      {
        test: '"string with space and {{not.so.stringNumber}}"',
        expect: [{ type: 'string', value: 'string with space and 1234' }],
      },
      {
        test: '"{{not.so.easy}}" 1',
        expect: [
          { type: 'string', value: 'data with space' },
          { type: 'integer', value: 1 },
        ],
      },
      {
        test: '"{{not.so.empty}}" 1',
        expect: [
          { type: 'string', value: '' },
          { type: 'integer', value: 1 },
        ],
      },
      {
        test: '',
        expect: [],
      },
    ];

    payloads.forEach((payload) => {
      const parsedPayload = parseTemplateNested(payload.test, data);
      const parsedArguments = stringToOSCArgs(parsedPayload);
      expect(parsedArguments).toStrictEqual(payload.expect);
    });
  });
});
