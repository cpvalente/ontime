import type { DatabaseModel } from 'ontime-types';
import { describe, expect, it } from 'vitest';

import { makeProjectPatch } from '../project.utils';

describe('makeProjectPatch', () => {
  it.each(['rundowns', 'customFields'])('includes field order when importing %s', async (section) => {
    // Only the project sections selected for import are read.
    const project = {
      rundowns: {},
      customFields: {
        fields: {
          Notes: { label: 'Notes', type: 'text', colour: '' },
          '2': { label: '2', type: 'text', colour: '' },
        },
        order: ['Notes', '2'],
      },
    } as DatabaseModel;

    const patch = await makeProjectPatch(project, { [section]: true });

    expect(patch.customFields).toEqual(project.customFields);
    expect(patch).not.toHaveProperty('customFieldOrder');
  });
});
