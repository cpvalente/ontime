import { EntryCustomFields, OntimeEvent } from 'ontime-types';
import { isValidChangeProperty } from '../integration.utils.js';

describe('isValidChangeProperty()', () => {
  test('correct value and property', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
    } as OntimeEvent;

    expect(isValidChangeProperty(testEvent, 'duration', 123)).toBeTruthy();
  });

  test('correct property and undefined value', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
    } as OntimeEvent;

    expect(isValidChangeProperty(testEvent, 'duration', undefined)).toBeFalsy();
  });

  test('missing property and undefined value', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
    } as OntimeEvent;

    expect(isValidChangeProperty(testEvent, 'missing', 123)).toBeFalsy();
  });

  test('non existing custom value', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
      custom: {
        field: 'test',
      } as EntryCustomFields,
    } as OntimeEvent;

    expect(isValidChangeProperty(testEvent, 'custom:test', 123)).toBeFalsy();
  });

  test('existing custom value', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
      custom: {
        test: 'test',
      } as EntryCustomFields,
    } as OntimeEvent;

    expect(isValidChangeProperty(testEvent, 'custom:test', 123)).toBeTruthy();
  });

  test('empty custom definition', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
      custom: {
        test: 'test',
      } as EntryCustomFields,
    } as OntimeEvent;

    expect(isValidChangeProperty(testEvent, 'custom:', 123)).toBeFalsy();
  });

  test('build-in in custom', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
      custom: {
        test: 'test',
      } as EntryCustomFields,
    } as OntimeEvent;

    expect(isValidChangeProperty(testEvent, 'custom:toString', 123)).toBeFalsy();
  });

  test('build-in in top object', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
      custom: {
        test: 'test',
      } as EntryCustomFields,
    } as OntimeEvent;

    expect(isValidChangeProperty(testEvent, 'toString', 123)).toBeFalsy();
  });
});
