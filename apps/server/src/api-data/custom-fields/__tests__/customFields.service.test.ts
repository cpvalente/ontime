import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { OntimeEvent } from 'ontime-types';

import { flushPendingWrites, getDataProvider, initPersistence } from '../../../classes/data-provider/DataProvider.js';
import { makeNewProject } from '../../../models/dataModel.js';
import { makeCustomField, makeOntimeEvent, makeRundown } from '../../rundown/__mocks__/rundown.mocks.js';
import { getCurrentRundown, processRundown, rundownCache } from '../../rundown/rundown.dao.js';
import {
  batchEditEntries,
  createCustomField,
  deleteCustomField,
  editCustomField,
  editEntry,
  mergeCustomFields,
  reorderCustomFields,
} from '../../rundown/rundown.service.js';

describe('custom field changes across project rundowns', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ontime-custom-fields-'));

    const project = makeNewProject();
    project.customFields = { fields: { Old: makeCustomField({ label: 'Old' }) }, order: ['Old'] };
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
    await flushPendingWrites();
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

  test('entry edits drop values for custom fields which do not exist', async () => {
    await editEntry('loaded', { id: 'a', custom: { Old: 'edited', Unknown: 'dropped' } });

    const cachedEntry = getCurrentRundown().entries.a as OntimeEvent;
    expect(cachedEntry.custom).toEqual({ Old: 'edited' });

    // the cache matches what processing the stored rundown would produce
    const processed = processRundown(
      getDataProvider().getRundown('loaded'),
      getDataProvider().getCustomFields().fields,
    );
    expect((processed.entries.a as OntimeEvent).custom).toEqual(cachedEntry.custom);
  });

  test('batch edits drop values for custom fields which do not exist', async () => {
    await batchEditEntries('loaded', ['a'], { custom: { Unknown: 'dropped' } });

    expect((getCurrentRundown().entries.a as OntimeEvent).custom).toEqual({ Old: 'loaded value' });
  });
});

describe('custom field order', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ontime-custom-field-order-'));

    const project = makeNewProject();
    project.customFields = {
      fields: {
        First: makeCustomField({ label: 'First' }),
        '2': makeCustomField({ label: '2' }),
        Third: makeCustomField({ label: 'Third' }),
      },
      order: ['First', '2', 'Third'],
    };
    await initPersistence(join(directory, 'db.json'), project);
    rundownCache.init(makeRundown({}), project.customFields);
  });

  afterEach(async () => {
    await flushPendingWrites();
    await rm(directory, { recursive: true, force: true });
  });

  test('a numeric key keeps its position rather than moving first', async () => {
    await createCustomField(makeCustomField({ label: 'Fourth' }));

    expect(getDataProvider().getData().customFields.order).toEqual(['First', '2', 'Third', 'Fourth']);
  });

  test('merging fields keeps existing positions and appends new fields in the given order', async () => {
    await mergeCustomFields({
      fields: {
        Zeta: makeCustomField({ label: 'Zeta' }),
        '5': makeCustomField({ label: '5' }),
        Third: makeCustomField({}),
      },
      order: ['Zeta', 'Third', '5'],
    });

    expect(getDataProvider().getData().customFields.order).toEqual(['First', '2', 'Third', 'Zeta', '5']);
  });

  test('renaming a field keeps its position', async () => {
    await editCustomField('First', { label: 'Renamed' });

    expect(getDataProvider().getData().customFields.order).toEqual(['Renamed', '2', 'Third']);
  });

  test('renaming a field to the label of another field is rejected', async () => {
    await expect(editCustomField('First', { label: 'Third' })).rejects.toThrow('Label already exists');

    expect(getDataProvider().getCustomFields().fields.Third.label).toBe('Third');
    expect(getDataProvider().getCustomFields().fields.First.label).toBe('First');
  });

  test('reordering persists the new order', async () => {
    await reorderCustomFields(['Third', 'First', '2']);

    expect(getDataProvider().getData().customFields.order).toEqual(['Third', 'First', '2']);
  });

  test('an overlapping field edit does not overwrite a saved order', async () => {
    await Promise.all([editCustomField('First', { colour: 'red' }), reorderCustomFields(['Third', 'First', '2'])]);

    expect(getDataProvider().getCustomFields()).toMatchObject({
      fields: { First: { colour: 'red' } },
      order: ['Third', 'First', '2'],
    });
  });

  test('deleting a field removes it from the order', async () => {
    await deleteCustomField('2');

    expect(getDataProvider().getData().customFields.order).toEqual(['First', 'Third']);
  });

  test('reordering keeps every field once, dropping unknown keys and appending missing fields', async () => {
    await reorderCustomFields(['Third', 'Unknown', 'Third', '2']);

    expect(getDataProvider().getData().customFields.order).toEqual(['Third', '2', 'First']);
  });
});
