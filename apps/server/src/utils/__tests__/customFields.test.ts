import { createCustomField, removeCustomField } from '../customFields.js';

describe('createCustomField()', () => {
  beforeEach(() => {
    vi.mock('../../classes/data-provider/DataProvider.js', () => {
      return {
        DataProvider: {
          ...vi.fn().mockImplementation(() => {
            return {};
          }),
          getCustomFields: vi.fn().mockReturnValue({}),
          setCustomFields: vi.fn().mockImplementation((newData) => {
            return newData;
          }),
        },
      };
    });
  });

  it('creates a field from given parameters', async () => {
    const expected = {
      lighting: {
        label: 'lighting',
        field: 'text',
      },
    };

    const customField = await createCustomField('lighting', 'text');
    expect(customField).toStrictEqual(expected);
  });
});

describe('editCustomField()', () => {
  it('edits a field with a given label', async () => {
    const expected = {
      lighting: {
        label: 'lighting',
        field: 'text',
      },
      sound: {
        label: 'sound',
        field: 'text',
      },
    };

    const customField = await createCustomField('sound', 'text');

    expect(customField).toStrictEqual(expected);
  });
});

describe('removeCustomField()', () => {
  it('deletes a field with a given label', async () => {
    const expected = {
      lighting: {
        label: 'lighting',
        field: 'text',
      },
    };

    const customField = await removeCustomField('sound');

    expect(customField).toStrictEqual(expected);
  });
});
