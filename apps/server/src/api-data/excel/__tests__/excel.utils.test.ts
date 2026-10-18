import { CustomFields } from 'ontime-types';
import { defaultImportMap } from 'ontime-utils';

import { demoDb } from '../../../models/demoProject.js';
import { getCustomFieldData, rundownToTabular } from '../excel.utils.js';

describe('getCustomFieldData()', () => {
  it('generates independent IDs and maps spreadsheet columns case-insensitively', () => {
    const result = getCustomFieldData(
      {
        ...defaultImportMap,
        custom: { Lighting: 'Lx', Video: 'AV' },
      },
      {},
    );
    const lightingId = result.customFieldImportKeys.lx;
    const videoId = result.customFieldImportKeys.av;

    expect(lightingId).not.toBe('Lighting');
    expect(videoId).not.toBe(lightingId);
    expect(result.mergedCustomFields).toEqual({
      [lightingId]: { label: 'Lighting', type: 'text', colour: '' },
      [videoId]: { label: 'Video', type: 'text', colour: '' },
    });
  });

  it('rejects ambiguous label mappings after merging independent projects', () => {
    const field = { label: 'Camera', type: 'text' as const, colour: '' };
    expect(() =>
      getCustomFieldData(
        { ...defaultImportMap, custom: { Camera: 'Cam' } },
        {
          first: field,
          second: field,
        },
      ),
    ).toThrow('Multiple custom fields are labelled "Camera"');
  });

  it('matches an existing field by label and preserves its ID, colour and type', () => {
    const existing: CustomFields = {
      abc123: { label: 'Lighting', type: 'image', colour: 'red' },
    };
    const result = getCustomFieldData(
      {
        ...defaultImportMap,
        custom: { Lighting: 'Lx' },
      },
      existing,
    );

    expect(result.customFieldImportKeys).toEqual({ lx: 'abc123' });
    expect(result.mergedCustomFields).toEqual(existing);
  });
});

describe('rundownToTabular()', () => {
  it('returns an array of arrays describing a rundown', () => {
    const testRundown = demoDb.rundowns['default'];
    const testCustomFields = demoDb.customFields.fields;

    const result = rundownToTabular(testRundown, testCustomFields);
    expect(result).toMatchSnapshot();
  });
});
