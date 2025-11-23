import { EntryCustomFields, OntimeEvent } from 'ontime-types';
import { isValidChangeProperty } from '../integration.utils.js';

describe('isValidateChangeProperty()', () => {
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

  test('missing existing custom follower', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
      custom: {
        test: 'test',
      } as EntryCustomFields,
    } as OntimeEvent;

    expect(isValidChangeProperty(testEvent, 'custom:', 123)).toBeFalsy();
  });

  test('disallow prototype values', () => {
    const testEvent = {
      id: 'test',
      duration: 111,
      custom: {
        test: 'test',
      } as EntryCustomFields,
    } as OntimeEvent;

    expect(isValidChangeProperty(testEvent, 'custom:hasOwnProperty', 123)).toBeFalsy();
  });
});
