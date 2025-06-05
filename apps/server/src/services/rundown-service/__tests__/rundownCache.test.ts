import { createCustomField, editCustomField, removeCustomField, customFieldChangelog } from '../rundownCache.js';

beforeAll(() => {
  vi.mock('../../../classes/data-provider/DataProvider.js', () => {
    return {
      getDataProvider: vi.fn().mockImplementation(() => {
        return {
          setCustomFields: vi.fn().mockImplementation((newData) => newData),
          setRundown: vi.fn().mockImplementation((newData) => newData),
        };
      }),
    };
  });
});

describe('custom fields flow', () => {
  describe('createCustomField()', () => {
    it('creates a field from given parameters', () => {
      const expected = {
        Lighting: {
          label: 'Lighting',
          type: 'string',
          colour: 'blue',
        },
      };

      const customField = createCustomField({ label: 'Lighting', type: 'string', colour: 'blue' });
      expect(customField).toStrictEqual(expected);
    });
  });

  describe('editCustomField()', () => {
    it('edits a field with a given label', () => {
      createCustomField({ label: 'Sound', type: 'string', colour: 'blue' });

      const expected = {
        Lighting: {
          label: 'Lighting',
          type: 'string',
          colour: 'blue',
        },
        Sound: {
          label: 'Sound',
          type: 'string',
          colour: 'green',
        },
      };

      const customField = editCustomField('Sound', { label: 'Sound', type: 'string', colour: 'green' });
      expect(customFieldChangelog).toStrictEqual({});
      expect(customField).toStrictEqual(expected);
    });

    it('renames a field to a new label', () => {
      const created = createCustomField({ label: 'Video', type: 'string', colour: 'red' });

      const expected = {
        Lighting: {
          label: 'Lighting',
          type: 'string',
          colour: 'blue',
        },
        Sound: {
          label: 'Sound',
          type: 'string',
          colour: 'green',
        },
        Video: {
          label: 'Video',
          type: 'string',
          colour: 'red',
        },
      };

      expect(created).toStrictEqual(expected);

      const expectedAfter = {
        Lighting: {
          label: 'Lighting',
          type: 'string',
          colour: 'blue',
        },
        Sound: {
          label: 'Sound',
          type: 'string',
          colour: 'green',
        },
        AV: {
          label: 'AV',
          type: 'string',
          colour: 'red',
        },
      };

      // We need to flush all scheduled tasks for the generate function to settle
      vi.useFakeTimers();
      const customField = editCustomField('Video', { label: 'AV', type: 'string', colour: 'red' });
      expect(customField).toStrictEqual(expectedAfter);
      expect(customFieldChangelog).toStrictEqual({ Video: 'AV' });
      editCustomField('AV', { label: 'Video' });
      vi.runAllTimers();
      expect(customFieldChangelog).toStrictEqual({});
      vi.useRealTimers();
    });
  });

  describe('removeCustomField()', () => {
    it('deletes a field with a given label', () => {
      const expected = {
        Lighting: {
          label: 'Lighting',
          type: 'string',
          colour: 'blue',
        },
        Video: {
          label: 'Video',
          type: 'string',
          colour: 'red',
        },
      };

      const customField = removeCustomField('Sound');

      expect(customField).toStrictEqual(expected);
    });
  });
});
