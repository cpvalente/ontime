import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { OntimeEvent } from 'ontime-types';

import { flushPendingWrites, getDataProvider, initPersistence } from '../../../classes/data-provider/DataProvider.js';
import { makeNewProject } from '../../../models/dataModel.js';
import { parseDatabaseModel } from '../../db/db.parser.js';
import { makeCustomField, makeOntimeEvent, makeRundown } from '../../rundown/__mocks__/rundown.mocks.js';
import { getCurrentRundown, processRundown, rundownCache } from '../../rundown/rundown.dao.js';
import { InvalidCustomFieldLabelError } from '../../rundown/rundown.errors.js';
import {
  batchEditEntries,
  deleteCustomField,
  editCustomField,
  editEntry,
  reorderCustomFields,
} from '../../rundown/rundown.service.js';

describe('custom field changes across project rundowns', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ontime-custom-fields-'));

    const project = makeNewProject();
    project.customFields = [makeCustomField({ label: 'Old' })];
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

    expect(customFields).toEqual([expect.objectContaining({ key: 'New', label: 'New' })]);
    expect((getCurrentRundown().entries.a as OntimeEvent).custom).toEqual({ New: 'loaded value' });
    expect((getDataProvider().getRundown('background').entries.b as OntimeEvent).custom).toEqual({
      New: 'background value',
    });
  });

  test('a rename is applied to the fields and every rundown before anything is saved', () => {
    // the project is written as a whole, so a save in between must not see the new key without the renamed values
    void editCustomField('Old', { label: 'New' });

    expect(getDataProvider().getCustomFields()).toEqual([expect.objectContaining({ key: 'New', label: 'New' })]);
    expect((getDataProvider().getRundown('loaded').entries.a as OntimeEvent).custom).toEqual({ New: 'loaded value' });
    expect((getDataProvider().getRundown('background').entries.b as OntimeEvent).custom).toEqual({
      New: 'background value',
    });
  });

  test('an edit without a label keeps the label, and the field survives a reload', async () => {
    await editCustomField('Old', { label: undefined, colour: '#ff0000' });

    const project = structuredClone(getDataProvider().getData());
    expect(project.customFields).toMatchObject([{ key: 'Old', label: 'Old', colour: '#ff0000' }]);

    const { data } = parseDatabaseModel(project);
    expect(data.customFields).toMatchObject([{ key: 'Old', label: 'Old', colour: '#ff0000' }]);
    expect((data.rundowns.background.entries.b as OntimeEvent).custom).toEqual({ Old: 'background value' });
  });

  test('an empty label is refused without changing the field', async () => {
    const before = structuredClone(getDataProvider().getCustomFields());
    await expect(editCustomField('Old', { label: '' })).rejects.toThrow();
    expect(getDataProvider().getCustomFields()).toEqual(before);
  });

  test('renaming a field moves empty values too', async () => {
    await editEntry('loaded', { id: 'a', custom: { Old: '' } });
    await editCustomField('Old', { label: 'New' });
    expect((getDataProvider().getRundown('loaded').entries.a as OntimeEvent).custom).not.toHaveProperty('Old');
  });

  test('deleting a field removes its values in the loaded and background rundowns', async () => {
    const customFields = await deleteCustomField('Old');

    expect(customFields).toEqual([]);
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
    await expect(editCustomField('Old', { label: 'Old/New' })).rejects.toBeInstanceOf(InvalidCustomFieldLabelError);

    expect((getDataProvider().getRundown('background').entries.b as OntimeEvent).custom).toEqual({
      Old: 'background value',
    });
  });

  test('entry edits drop values for custom fields which do not exist', async () => {
    await editEntry('loaded', { id: 'a', custom: { Old: 'edited', Unknown: 'dropped' } });

    const cachedEntry = getCurrentRundown().entries.a as OntimeEvent;
    expect(cachedEntry.custom).toEqual({ Old: 'edited' });

    // the cache matches what processing the stored rundown would produce
    const processed = processRundown(getDataProvider().getRundown('loaded'), getDataProvider().getCustomFields());
    expect((processed.entries.a as OntimeEvent).custom).toEqual(cachedEntry.custom);
  });

  test('batch edits drop values for custom fields which do not exist', async () => {
    await batchEditEntries('loaded', ['a'], { custom: { Unknown: 'dropped' } });

    expect((getCurrentRundown().entries.a as OntimeEvent).custom).toEqual({ Old: 'loaded value' });
  });
});

describe('custom field order', () => {
  let directory: string;
  const storedKeys = () =>
    getDataProvider()
      .getData()
      .customFields.map((field) => field.key);

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ontime-custom-field-order-'));

    const project = makeNewProject();
    project.customFields = [
      makeCustomField({ label: 'First' }),
      makeCustomField({ label: '2' }),
      makeCustomField({ label: 'Third' }),
    ];
    await initPersistence(join(directory, 'db.json'), project);
    rundownCache.init(makeRundown({}), project.customFields);
  });

  afterEach(async () => {
    await flushPendingWrites();
    await rm(directory, { recursive: true, force: true });
  });

  test('renaming a field keeps its position', async () => {
    await editCustomField('First', { label: 'Renamed' });

    expect(storedKeys()).toEqual(['Renamed', '2', 'Third']);
  });

  test('renaming a field to the label of another field is rejected', async () => {
    await expect(editCustomField('First', { label: 'Third' })).rejects.toThrow('Label Third already exists');

    expect(
      getDataProvider()
        .getCustomFields()
        .map((field) => field.label),
    ).toEqual(['First', '2', 'Third']);
  });

  test('reordering persists the new order', async () => {
    await reorderCustomFields(['Third', 'First', '2']);

    expect(storedKeys()).toEqual(['Third', 'First', '2']);
  });

  test.each([[['Third', 'Unknown']], [['Third', 'Third', '2']]])('reordering refuses %j', async (order) => {
    await expect(reorderCustomFields(order)).rejects.toThrow('at most once');

    expect(storedKeys()).toEqual(['First', '2', 'Third']);
  });
});
