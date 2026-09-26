import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { initPersistence, getDataProvider } from '../../../classes/data-provider/DataProvider.js';
import { makeNewProject, makeNewRundown } from '../../../models/dataModel.js';
import { makeCustomField } from '../__mocks__/rundown.mocks.js';
import { getProjectCustomFields, rundownCache } from '../rundown.dao.js';
import { applyImportToRundown, createCustomField } from '../rundown.service.js';

describe('custom fields written by an import', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ontime-custom-fields-'));

    const project = makeNewProject('loaded');
    project.rundowns.background = makeNewRundown('background');
    await initPersistence(join(directory, 'db.json'), project);
    rundownCache.init(project.rundowns.loaded, project.customFields);
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  test('importing into a background rundown keeps the cached custom fields in step', async () => {
    const imported = { Imported: makeCustomField({ label: 'Imported' }) };

    await applyImportToRundown('override', 'background', makeNewRundown('incoming'), imported, {
      event: [],
      custom: [],
    });

    expect(getProjectCustomFields()).toHaveProperty('Imported');

    // a later custom field edit must not drop the imported field
    await createCustomField(makeCustomField({ label: 'Later' }));

    expect(Object.keys(getDataProvider().getCustomFields())).toEqual(['Imported', 'Later']);
  });
});
