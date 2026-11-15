import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { NewCustomField, OntimeEvent } from 'ontime-types';

import { flushPendingWrites, getDataProvider, initPersistence } from '../../../classes/data-provider/DataProvider.js';
import { makeNewProject } from '../../../models/dataModel.js';
import { parseDatabaseModel } from '../../db/db.parser.js';
import { makeCustomField, makeOntimeEvent, makeRundown } from '../../rundown/__mocks__/rundown.mocks.js';
import { getCurrentRundown, processRundown, rundownCache } from '../../rundown/rundown.dao.js';
import { InvalidCustomFieldLabelError } from '../../rundown/rundown.errors.js';
import {
  addEntry,
  batchEditEntries,
  createCustomField,
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

describe('option custom fields', () => {
  let directory: string;
  const options = [
    { label: 'Ready', colour: '#00ff00' },
    { label: 'Hold', colour: '' },
    { label: 'Cut', colour: '#ff0000' },
  ];
  const valueOf = (rundownId: string, entryId: string) =>
    (getDataProvider().getRundown(rundownId).entries[entryId] as OntimeEvent).custom.Status;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ontime-option-fields-'));

    const project = makeNewProject();
    project.customFields = [makeCustomField({ label: 'Status', type: 'option', options })];
    project.rundowns = {
      loaded: makeRundown({
        id: 'loaded',
        entries: {
          a: makeOntimeEvent({ id: 'a', custom: { Status: 'Ready' } }),
          b: makeOntimeEvent({ id: 'b', custom: { Status: 'Hold' } }),
          c: makeOntimeEvent({ id: 'c', custom: { Status: 'Imported' } }),
        },
        order: ['a', 'b', 'c'],
      }),
      background: makeRundown({
        id: 'background',
        entries: { d: makeOntimeEvent({ id: 'd', custom: { Status: 'Ready' } }) },
        order: ['d'],
      }),
    };
    await initPersistence(join(directory, 'db.json'), project);
    rundownCache.init(project.rundowns.loaded, project.customFields);
  });

  afterEach(async () => {
    await flushPendingWrites();
    await rm(directory, { recursive: true, force: true });
  });

  test('creating an option field keeps only its type properties and trims the options', async () => {
    const customFields = await createCustomField({
      label: 'Camera',
      type: 'option',
      colour: '',
      options: [{ label: ' CAM 1 ', colour: '' }],
      extra: true,
    } as NewCustomField);
    expect(customFields.at(-1)).toEqual({
      key: 'Camera',
      label: 'Camera',
      type: 'option',
      colour: '',
      options: [{ label: 'CAM 1', colour: '' }],
    });
  });

  test('creating an option field needs valid options', async () => {
    await expect(createCustomField({ label: 'Camera', type: 'option', colour: '', options: [] })).rejects.toThrow(
      'Add at least one option',
    );
    await expect(
      createCustomField({ label: 'Camera', type: 'option', colour: '', options: 'CAM 1' as never }),
    ).rejects.toThrow('Add at least one option');
  });

  test('renaming an option moves its values in every rundown', async () => {
    await editCustomField('Status', {
      options: [{ label: 'Standby', colour: '#00ff00' }, options[1], options[2]],
      renamedOptions: { Ready: 'Standby' },
    });

    expect(valueOf('loaded', 'a')).toBe('Standby');
    expect(valueOf('loaded', 'b')).toBe('Hold');
    expect(valueOf('background', 'd')).toBe('Standby');
  });

  test('removing an option clears its values in every rundown, values which were never options are kept', async () => {
    await editCustomField('Status', { options: [options[1], options[2]] });

    expect(valueOf('loaded', 'a')).toBeUndefined();
    expect(valueOf('background', 'd')).toBeUndefined();
    expect(valueOf('loaded', 'b')).toBe('Hold');
    expect(valueOf('loaded', 'c')).toBe('Imported');
  });

  test('renaming the field and its options together moves the values to the new key and label', async () => {
    await editCustomField('Status', {
      label: 'State',
      options: [{ label: 'Go', colour: '' }, options[1]],
      renamedOptions: { Ready: 'Go' },
    });

    const entry = getDataProvider().getRundown('background').entries.d as OntimeEvent;
    expect(entry.custom).toEqual({ State: 'Go' });
  });

  test('invalid option edits are refused without changing anything', async () => {
    const before = structuredClone(getDataProvider().getData());
    await expect(editCustomField('Status', { options: [] })).rejects.toThrow('Add at least one option');
    await expect(editCustomField('Status', { options, renamedOptions: { Ready: 'Missing' } })).rejects.toThrow(
      'Cannot rename "Ready" to "Missing"',
    );
    await expect(editCustomField('Status', { renamedOptions: { Ready: 'Hold' } })).rejects.toThrow(
      'Renamed options need the new options list',
    );
    // a rename which matches no option would otherwise read as a removal and clear the values
    await expect(
      editCustomField('Status', { options: [options[1], options[2]], renamedOptions: { ready: 'Hold' } }),
    ).rejects.toThrow('"ready" is not an option to rename');
    expect(getDataProvider().getData()).toEqual(before);
  });

  test('a text field takes no options', async () => {
    await createCustomField({ label: 'Note', type: 'text', colour: '' });
    await expect(editCustomField('Note', { options })).rejects.toThrow('Only option fields have options');
  });

  test('entry writes take an option label or empty', async () => {
    await editEntry('loaded', { id: 'a', custom: { Status: 'Cut' } });
    expect(valueOf('loaded', 'a')).toBe('Cut');
    await editEntry('loaded', { id: 'a', custom: { Status: '' } });
    expect(valueOf('loaded', 'a')).toBe('');

    await expect(editEntry('loaded', { id: 'a', custom: { Status: 'cut' } })).rejects.toThrow(
      '"cut" is not an option of Status',
    );
    await expect(batchEditEntries('loaded', ['a', 'b'], { custom: { Status: 'Nope' } })).rejects.toThrow(
      '"Nope" is not an option of Status',
    );
    await expect(addEntry('loaded', { type: 'event', custom: { Status: 'Nope' } } as never)).rejects.toThrow(
      '"Nope" is not an option of Status',
    );
  });

  test('an entry can be resent with the value it holds, even when it is not an option', async () => {
    await expect(editEntry('loaded', { id: 'c', custom: { Status: 'Imported' } })).resolves.toBeDefined();
    expect(valueOf('loaded', 'c')).toBe('Imported');
  });
});
