import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { OntimeEvent } from 'ontime-types';

import { getDataProvider, initPersistence } from '../../../classes/data-provider/DataProvider.js';
import { makeNewProject } from '../../../models/dataModel.js';
import { makeCustomField, makeOntimeEvent, makeRundown } from '../../rundown/__mocks__/rundown.mocks.js';
import { getCurrentRundown, rundownCache } from '../../rundown/rundown.dao.js';
import { deleteCustomField, editCustomField } from '../../rundown/rundown.service.js';

describe('custom field changes across project rundowns', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ontime-custom-fields-'));

    const project = makeNewProject();
    project.customFields = { Old: makeCustomField({ label: 'Old' }) };
    project.rundowns = {
      loaded: makeRundown({
        id: 'loaded',
        entries: { a: makeOntimeEvent({ id: 'a', custom: { Old: 'loaded value' } }) },
        order: ['a'],
      }),
      background: makeRundown({
        id: 'background',
        entries: { b: makeOntimeEvent({ id: 'b', custom: { Old: 'background value' } }) },
        order: ['b'],
      }),
    };
    await initPersistence(join(directory, 'db.json'), project);
    rundownCache.init(project.rundowns.loaded, project.customFields);
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  test('renaming a field moves its values in the loaded and background rundowns', async () => {
    const customFields = await editCustomField('Old', { label: 'New' });

    expect(Object.keys(customFields)).toEqual(['New']);
    expect((getCurrentRundown().entries.a as OntimeEvent).custom).toEqual({ New: 'loaded value' });
    expect((getDataProvider().getRundown('background').entries.b as OntimeEvent).custom).toEqual({
      New: 'background value',
    });
  });

  test('deleting a field removes its values in the loaded and background rundowns', async () => {
    const customFields = await deleteCustomField('Old');

    expect(customFields).toEqual({});
    expect((getCurrentRundown().entries.a as OntimeEvent).custom).toEqual({});
    expect((getDataProvider().getRundown('background').entries.b as OntimeEvent).custom).toEqual({});
  });

  test('renaming a field keeps a background edit made while the rename is committing', async () => {
    // runs synchronously up to its first await
    const rename = editCustomField('Old', { label: 'New' });

    // a concurrent edit to the background rundown lands before the rename finishes
    const background = getDataProvider().getRundown('background');
    const entry = background.entries.b as OntimeEvent;
    void getDataProvider().setRundown('background', {
      ...background,
      entries: { b: { ...entry, title: 'concurrent edit' } },
    });

    await rename;

    const result = getDataProvider().getRundown('background').entries.b as OntimeEvent;
    expect(result.title).toBe('concurrent edit');
    expect(result.custom).toEqual({ New: 'background value' });
  });

  test('a rejected edit leaves the background rundowns untouched', async () => {
    await expect(editCustomField('Old', { label: 'New', type: 'image' })).rejects.toThrow();

    expect((getDataProvider().getRundown('background').entries.b as OntimeEvent).custom).toEqual({
      Old: 'background value',
    });
  });
});
