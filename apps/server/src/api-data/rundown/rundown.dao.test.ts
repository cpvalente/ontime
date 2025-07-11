import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Rundown, CustomFields, RundownId, OntimeEvent, EntryId, RundownMetadata, CustomFieldsMetadata } from 'ontime-types';
import * as rundownDao from './rundown.dao'; // Import all exports

// Mock DataProvider
const mockSetRundown = vi.fn();
const mockSetCustomFields = vi.fn();
const mockGetData = vi.fn(); // May not be needed for DAO tests directly

vi.mock('../../classes/data-provider/DataProvider.js', () => ({
  getDataProvider: () => ({
    setRundown: mockSetRundown,
    setCustomFields: mockSetCustomFields,
    getData: mockGetData,
    // Add other methods if they become necessary and need mocking
  }),
}));

// Helper to create a basic rundown
const createSampleRundown = (id: RundownId, title: string, revision: number = 0): Readonly<Rundown> => ({
  id,
  title,
  order: [],
  flatOrder: [],
  entries: {},
  revision,
});

// Helper to create basic custom fields
const createSampleCustomFields = (): Readonly<CustomFields> => ({
  field1: { label: 'Field 1', type: 'text', colour: '#FF0000' },
});

describe('Rundown DAO', () => {
  let sampleRundown1: Readonly<Rundown>;
  let sampleRundown2: Readonly<Rundown>;
  let sampleCustomFields: Readonly<CustomFields>;

  beforeEach(() => {
    // Reset mocks and DAO internal state before each test
    mockSetRundown.mockClear();
    mockSetCustomFields.mockClear();

    // Clear internal caches of rundownDao by removing all known rundowns
    // This assumes we can get all keys or have a reset mechanism.
    // For now, we'll rely on removeRundownFromCache if available, or test around existing state.
    // A proper reset function in the DAO for testing would be ideal.
    // For now, let's assume tests manage their own rundown IDs to avoid collision.

    sampleRundown1 = createSampleRundown('rd1', 'Rundown One');
    sampleRundown2 = createSampleRundown('rd2', 'Rundown Two');
    sampleCustomFields = createSampleCustomFields();
  });

  afterEach(() => {
    // Cleanup: remove any rundowns created during tests to ensure test isolation
    rundownDao.removeRundownFromCache('rd1');
    rundownDao.removeRundownFromCache('rd2');
    rundownDao.removeRundownFromCache('rd_commit_test');
     // Clear projectCustomFields by re-initializing with empty object - a bit hacky
    rundownDao.init(createSampleRundown('temp_cleanup_rd', 'Cleanup'), {});
    rundownDao.removeRundownFromCache('temp_cleanup_rd');
  });

  describe('init', () => {
    it('should initialize a new rundown, store it in cache, and update metadata', async () => {
      const { rundown, rundownMetadata, customFields, revision } = rundownDao.init(sampleRundown1, sampleCustomFields);

      expect(rundown.id).toBe('rd1');
      expect(rundown.title).toBe('Rundown One');
      expect(revision).toBe(0); // Initial revision from sampleRundown1
      expect(customFields).toEqual(sampleCustomFields);

      expect(rundownDao.getCurrentRundown('rd1')).toEqual(rundown);
      expect(rundownDao.getRundownMetadata('rd1')).toEqual(rundownMetadata);
      expect(rundownDao.getCustomFieldsMetadata('rd1')).toBeDefined();
      expect(rundownDao.getProjectCustomFields()).toEqual(sampleCustomFields);

      // Check if persistence was called (uses setImmediate, so might need to handle async)
      await vi.waitFor(() => {
        expect(mockSetRundown).toHaveBeenCalledWith('rd1', expect.objectContaining({ id: 'rd1' }));
      });
    });

    it('should update projectCustomFields if new custom fields are provided', () => {
      rundownDao.init(sampleRundown1, {}); // Initial empty
      expect(rundownDao.getProjectCustomFields()).toEqual({});
      rundownDao.init(sampleRundown2, sampleCustomFields); // Now with custom fields
      expect(rundownDao.getProjectCustomFields()).toEqual(sampleCustomFields);
    });
  });

  describe('Getter Functions', () => {
    beforeEach(() => {
      rundownDao.init(sampleRundown1, sampleCustomFields);
      rundownDao.init(sampleRundown2, {}); // No specific custom fields for this one, uses project global
    });

    it('getCurrentRundown should retrieve the correct rundown by ID', () => {
      expect(rundownDao.getCurrentRundown('rd1')?.title).toBe('Rundown One');
      expect(rundownDao.getCurrentRundown('rd2')?.title).toBe('Rundown Two');
      expect(rundownDao.getCurrentRundown('nonexistent')).toBeUndefined();
    });

    it('getRundownMetadata should retrieve metadata for the correct rundown by ID', () => {
      expect(rundownDao.getRundownMetadata('rd1')).toBeDefined();
      expect(rundownDao.getRundownMetadata('rd2')).toBeDefined();
      expect(rundownDao.getRundownMetadata('nonexistent')).toBeUndefined();
    });

    it('getCustomFieldsMetadata should retrieve custom fields metadata for the correct rundown by ID', () => {
      expect(rundownDao.getCustomFieldsMetadata('rd1')).toBeDefined();
      expect(rundownDao.getCustomFieldsMetadata('rd1')?.assigned).toEqual({}); // Initially empty
      expect(rundownDao.getCustomFieldsMetadata('nonexistent')).toBeUndefined();
    });

    it('getEntryWithId should retrieve an entry from the specified rundown', () => {
      // Add an entry to sampleRundown1 for testing
      const event: OntimeEvent = { id: 'ev1', type: 'event', title: 'Event 1', timeStart: 0, duration: 1000, revision: 0, custom: {}, linkStart: false, parent: null, dayOffset: 0, delay:0, gap:0 };
      const transaction = rundownDao.createTransaction('rd1', { mutableRundown: true });
      rundownDao.rundownMutation.add(transaction.rundown, event, null, null);
      transaction.commit(true); // process to update entries in cache

      expect(rundownDao.getEntryWithId('rd1', 'ev1')?.title).toBe('Event 1');
      expect(rundownDao.getEntryWithId('rd1', 'nonexistent')).toBeUndefined();
      expect(rundownDao.getEntryWithId('rd2', 'ev1')).toBeUndefined(); // Should not find in another rundown
    });

    it('rundownCache.get should retrieve rundown, metadata, and project custom fields', () => {
        const cacheDataRd1 = rundownDao.rundownCache.get('rd1');
        expect(cacheDataRd1.rundown?.id).toBe('rd1');
        expect(cacheDataRd1.metadata).toBeDefined();
        expect(cacheDataRd1.customFields).toEqual(sampleCustomFields);

        const cacheDataNonExistent = rundownDao.rundownCache.get('nonexistent');
        expect(cacheDataNonExistent.rundown).toBeUndefined();
        expect(cacheDataNonExistent.metadata).toBeUndefined();
        expect(cacheDataNonExistent.customFields).toEqual(sampleCustomFields); // Still returns global CFs
    });
  });

  describe('removeRundownFromCache', () => {
    beforeEach(() => {
      rundownDao.init(sampleRundown1, sampleCustomFields);
    });

    it('should remove the rundown and its metadata from caches', () => {
      expect(rundownDao.getCurrentRundown('rd1')).toBeDefined();
      const result = rundownDao.removeRundownFromCache('rd1');
      expect(result).toBe(true);
      expect(rundownDao.getCurrentRundown('rd1')).toBeUndefined();
      expect(rundownDao.getRundownMetadata('rd1')).toBeUndefined();
      expect(rundownDao.getCustomFieldsMetadata('rd1')).toBeUndefined();
    });

    it('should return false if rundownId does not exist', () => {
      const result = rundownDao.removeRundownFromCache('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('createTransaction and commit', () => {
    it('should update a rundown title without processing and increment revision', async () => {
      rundownDao.init(createSampleRundown('rd_commit_test', 'Initial Title'), {});
      const tx = rundownDao.createTransaction('rd_commit_test', { mutableRundown: true });
      tx.rundown.title = 'Updated Title';
      const { rundown: committedRundown, revision } = tx.commit(false); // No processing

      expect(committedRundown.title).toBe('Updated Title');
      expect(revision).toBe(1); // 0 (init) + 1 (commit)
      expect(rundownDao.getCurrentRundown('rd_commit_test')?.title).toBe('Updated Title');
      expect(rundownDao.getCurrentRundown('rd_commit_test')?.revision).toBe(1);

      await vi.waitFor(() => {
        expect(mockSetRundown).toHaveBeenCalledWith('rd_commit_test', expect.objectContaining({ title: 'Updated Title', revision: 1 }));
      });
    });

    // More complex transaction tests (e.g., with processing, custom field changes) would go here.
    // For example, testing that adding an event and committing with shouldProcess=true updates metadata.
    // This requires more setup for event data and validation of metadata changes.

    it('should throw an error if creating a transaction for a non-existent rundownId', () => {
      expect(() => rundownDao.createTransaction('non_existent_rd', { mutableRundown: true })).toThrow();
    });

    it('should update projectCustomFields if mutableCustomFields is true', async () => {
      rundownDao.init(sampleRundown1, {}); // Start with empty project custom fields
      const tx = rundownDao.createTransaction('rd1', { mutableRundown: false, mutableCustomFields: true });
      tx.customFields['newField'] = { label: 'New Field', type: 'text', colour: '#00FF00' };
      tx.commit(false);

      expect(rundownDao.getProjectCustomFields()['newField']).toBeDefined();
      expect(rundownDao.getProjectCustomFields()['newField']?.label).toBe('New Field');

      await vi.waitFor(() => {
        expect(mockSetCustomFields).toHaveBeenCalledWith(expect.objectContaining({
          newField: { label: 'New Field', type: 'text', colour: '#00FF00' }
        }));
      });
    });
  });
});
