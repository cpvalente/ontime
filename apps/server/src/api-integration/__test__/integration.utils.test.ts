import { CustomFields, EntryCustomFields, OntimeDelay, OntimeEvent } from 'ontime-types';
import { isValidChangeProperty } from '../integration.utils.js';

describe('isValidChangeProperty()', () => {
  test('allows changing a valid event property with valid value', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
    } as OntimeEvent;

    expect(isValidChangeProperty(testEvent, 'duration', 123, {})).toBeTruthy();
  });

  test('forbids changing a valid event property with undefined value', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
    } as OntimeEvent;

    expect(isValidChangeProperty(testEvent, 'duration', undefined, {})).toBeFalsy();
  });

  test('forbids changing a non-existing property', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
    } as OntimeEvent;

    expect(isValidChangeProperty(testEvent, 'missing', 123, {})).toBeFalsy();
  });

  test('forbids changing customValues in event without custom fields', () => {
    const testDelay = {
      id: 'test',
      duration: 111,
    } as OntimeDelay;

    const testCustomFields = {
      test: {
        type: 'text',
        colour: '#ffffff',
        label: 'Test Field',
      },
    } satisfies CustomFields;

    expect(isValidChangeProperty(testDelay, 'custom:test', 123, testCustomFields)).toBeFalsy();
  });

  test('forbids changing a non-existing custom value', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
      custom: {
        field: 'test',
      } as EntryCustomFields,
    } as OntimeEvent;

    expect(isValidChangeProperty(testEvent, 'custom:test', 123, {})).toBeFalsy();
  });

  test('allows changing an existing custom value', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
      custom: {
        test: 'test',
      } as EntryCustomFields,
    } as OntimeEvent;

    const testCustomFields = {
      test: {
        type: 'text',
        colour: '#ffffff',
        label: 'Test Field',
      },
    } satisfies CustomFields;

    expect(isValidChangeProperty(testEvent, 'custom:test', 123, testCustomFields)).toBeTruthy();
  });

  test('forbids changing a custom field with a missing value', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
      custom: {
        test: 'test',
      } as EntryCustomFields,
    } as OntimeEvent;

    const testCustomFields = {
      test: {
        type: 'text',
        colour: '#ffffff',
        label: 'Test Field',
      },
    } satisfies CustomFields;

    expect(isValidChangeProperty(testEvent, 'custom:', 123, testCustomFields)).toBeFalsy();
  });

  test('forbids references to prototype properties in custom object', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
      custom: {
        test: 'test',
      } as EntryCustomFields,
    } as OntimeEvent;

    const testCustomFields = {
      test: {
        type: 'text',
        colour: '#ffffff',
        label: 'Test Field',
      },
    } satisfies CustomFields;

    expect(isValidChangeProperty(testEvent, 'custom:toString', 123, testCustomFields)).toBeFalsy();
  });

  test('forbids references to prototype properties in object', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
      custom: {
        test: 'test',
      } as EntryCustomFields,
    } as OntimeEvent;

    const testCustomFields = {
      test: {
        type: 'text',
        colour: '#ffffff',
        label: 'Test Field',
      },
    } satisfies CustomFields;

    expect(isValidChangeProperty(testEvent, 'toString', 123, testCustomFields)).toBeFalsy();
  });
});
