import { ErrorResponse, OntimeEntry, ProjectRundownsList, Rundown } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';
import express from 'express';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { makeNewRundown } from '../../models/dataModel.js';

import { paramsWithId } from '../validation-utils/validationFunction.js';

import { getCurrentRundown } from './rundown.dao.js';
import {
  addEntry,
  applyDelay,
  batchEditEntries,
  cloneEntry,
  deleteAllEntries,
  deleteEntries,
  editEntry,
  groupEntries,
  initRundown,
  reorderEntry,
  swapEvents,
  loadRundown,
  ungroupEntries,
} from './rundown.service.js';
import {
  rundownArrayOfIds,
  entryBatchPutValidator,
  entryPostValidator,
  rundownPostValidator,
  entryPutValidator,
  entryReorderValidator,
  entrySwapValidator,
  validateRundownMutation,
  clonePostValidator,
} from './rundown.validation.js';
import { duplicateRundown, normalisedToRundownArray } from './rundown.utils.js';

export const router = express.Router();

// #region operations on project rundowns =========================

/**
 * Returns all rundowns in the project
 */
router.get('/', async (_req: Request, res: Response<ProjectRundownsList>) => {
  const projectRundowns = getDataProvider().getProjectRundowns();
  res.json({ loaded: getCurrentRundown().id, rundowns: normalisedToRundownArray(projectRundowns) });
});

/**
 * Returns the current rundown
 */
router.get('/current', async (_req: Request, res: Response<Rundown>) => {
  const rundown = getCurrentRundown();
  res.json(rundown);
});

/**
 * Loads a given rundown
 */
router.post('/:id/load', paramsWithId, async (req: Request, res: Response<ProjectRundownsList | ErrorResponse>) => {
  try {
    const projectRundowns = await loadRundown(req.params.id);
    res.status(200).json({ loaded: getCurrentRundown().id, rundowns: normalisedToRundownArray(projectRundowns) });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

/**
 * Creates a new rundown
 */
router.post('/', rundownPostValidator, async (req: Request, res: Response<ProjectRundownsList | ErrorResponse>) => {
  try {
    const emptyRundown = makeNewRundown();
    emptyRundown.title = req.body.title;
    await getDataProvider().setRundown(emptyRundown.id, emptyRundown);

    const projectRundowns = getDataProvider().getProjectRundowns();
    res.status(201).json({ loaded: getCurrentRundown().id, rundowns: normalisedToRundownArray(projectRundowns) });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

/**
 * Duplicates an existing rundown
 */
router.post(
  '/:id/duplicate',
  paramsWithId,
  async (req: Request, res: Response<ProjectRundownsList | ErrorResponse>) => {
    try {
      const dataProvider = getDataProvider();
      const rundown = dataProvider.getRundown(req.params.id);

      const duplicatedRundown: Rundown = duplicateRundown(rundown, `Copy of ${rundown.title}`);
      await dataProvider.setRundown(duplicatedRundown.id, duplicatedRundown);

      const projectRundowns = getDataProvider().getProjectRundowns();
      res.status(201).json({ loaded: getCurrentRundown().id, rundowns: normalisedToRundownArray(projectRundowns) });
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

/**
 * Patches the data of an existing rundown
 * Currently only the title can be changed
 */
router.patch('/:id', paramsWithId, async (req: Request, res: Response<ProjectRundownsList | ErrorResponse>) => {
  try {
    const dataProvider = getDataProvider();
    const rundown = dataProvider.getRundown(req.params.id);
    if (!rundown) throw new Error(`Rundown with ID ${req.params.id} not found`);
    if (!req.body.title) throw new Error('No title provided');

    await dataProvider.setRundown(rundown.id, { ...rundown, title: req.body.title });

    /**
     * If loaded we re-init the rundown
     * This is likely over-kill but the simplest way to ensure state consistency
     */
    if (req.params.id === getCurrentRundown().id) {
      const rundown = dataProvider.getRundown(req.params.id);
      const customField = dataProvider.getCustomFields();
      await initRundown(rundown, customField);
    }

    const projectRundowns = getDataProvider().getProjectRundowns();
    res.status(201).json({ loaded: getCurrentRundown().id, rundowns: normalisedToRundownArray(projectRundowns) });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

/**
 * Deletes a rundown if not loaded
 */
router.delete('/:id', paramsWithId, async (req: Request, res: Response<ProjectRundownsList | ErrorResponse>) => {
  try {
    if (req.params.id === getCurrentRundown().id) {
      res.status(400).send({ message: 'Cannot delete loaded rundown' });
      return;
    }

    const dataProvider = getDataProvider();
    const projectRundowns = dataProvider.getProjectRundowns();

    if (Object.keys(projectRundowns).length <= 1) {
      // might never hit this as it is likely covered by the case of trying to delete the loaded rundown
      res.status(400).send({ message: 'Cannot delete the last rundown' });
      return;
    }

    await dataProvider.deleteRundown(req.params.id);
    const newProjectRundowns = getDataProvider().getProjectRundowns();
    res.status(200).json({ loaded: getCurrentRundown().id, rundowns: normalisedToRundownArray(newProjectRundowns) });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

// #endregion operations on project rundowns ======================

// #region operations on rundown entries ==========================

/**
 * Creates a new entry in a given rundown
 */
router.post(
  '/:rundownId/entry',
  entryPostValidator,
  validateRundownMutation,
  async (req: Request, res: Response<OntimeEntry | ErrorResponse>) => {
    try {
      const newEvent = await addEntry(req.body);
      res.status(201).send(newEvent);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

/**
 * Edits an entry in a given rundown
 */
router.put(
  '/:rundownId/entry',
  entryPutValidator,
  validateRundownMutation,
  async (req: Request, res: Response<OntimeEntry | ErrorResponse>) => {
    try {
      const event = await editEntry(req.body);
      res.status(200).send(event);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

/**
 * Edits an entry in a given rundown
 */
router.put(
  '/:rundownId/batch',
  entryBatchPutValidator,
  validateRundownMutation,
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const rundown = await batchEditEntries(req.body.ids, req.body.data);
      res.status(200).send(rundown);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

/**
 * Reorders two entries in a rundown
 */
router.patch(
  '/:rundownId/reorder',
  entryReorderValidator,
  validateRundownMutation,
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const { entryId, destinationId, order } = req.body;
      const rundown = await reorderEntry(entryId, destinationId, order);
      res.status(200).send(rundown);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

/**
 * Applies a delay into the schedule
 */
router.patch(
  '/:rundownId/applydelay/:id',
  paramsWithId,
  validateRundownMutation,
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const rundown = await applyDelay(req.params.id);
      res.status(200).send(rundown);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

/**
 * Swaps data between two Ontime events
 */
router.patch(
  '/:rundownId/swap',
  entrySwapValidator,
  validateRundownMutation,
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const rundown = await swapEvents(req.body.from, req.body.to);
      res.status(200).send(rundown);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

/**
 * Clones the contents of an entry into a new one
 */
router.post(
  '/:rundownId/clone/:id',
  paramsWithId,
  clonePostValidator,
  validateRundownMutation,
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const rundown = await cloneEntry(req.params.id, {
        before: req.body?.before,
        after: req.body?.after,
      });
      res.status(200).send(rundown);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

/**
 * Creates a group out of a list of entries
 */
router.post(
  '/:rundownId/group',
  rundownArrayOfIds,
  validateRundownMutation,
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const rundown = await groupEntries(req.body.ids);
      res.status(200).send(rundown);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

/**
 * Dissolves a group by moving its children to the main rundown
 */
router.post(
  '/:rundownId/ungroup/:id',
  paramsWithId,
  validateRundownMutation,
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const rundown = await ungroupEntries(req.params.id);
      res.status(200).send(rundown);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

/**
 * Deletes a list of entries by their ID
 */
router.delete(
  '/:rundownId/entries',
  rundownArrayOfIds,
  validateRundownMutation,
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const rundown = await deleteEntries(req.body.ids);
      res.status(200).send(rundown);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

/**
 * Deletes all entries in a given rundown
 */
router.delete(
  '/:rundownId/all',
  validateRundownMutation,
  async (_req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const rundown = await deleteAllEntries();
      res.status(200).send(rundown);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

// #endregion operations on rundown entries =======================
