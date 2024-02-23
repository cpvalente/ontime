import { createCustomField, editCustomField, removeCustomField } from '../customFields.js';

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
        type: 'string',
        colour: 'blue',
      },
    };

    const customField = await createCustomField({ label: 'lighting', type: 'string', colour: 'blue' });
    expect(customField).toStrictEqual(expected);
  });
});

describe('editCustomField()', () => {
  it('edits a field with a given label', async () => {
    await createCustomField({ label: 'sound', type: 'string', colour: 'blue' });

    const expected = {
      lighting: {
        label: 'lighting',
        type: 'string',
        colour: 'blue',
      },
      sound: {
        label: 'sound',
        type: 'string',
        colour: 'blue',
      },
    };

    const customField = await editCustomField('sound', { label: 'sound', type: 'string', colour: 'blue' });

    expect(customField).toStrictEqual(expected);
  });
});

describe('removeCustomField()', () => {
  it('deletes a field with a given label', async () => {
    const expected = {
      lighting: {
        label: 'lighting',
        type: 'string',
        colour: 'blue',
      },
    };

    const customField = await removeCustomField('sound');

    expect(customField).toStrictEqual(expected);
  });
});
