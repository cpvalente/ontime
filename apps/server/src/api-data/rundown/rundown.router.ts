import type { Request, Response, Router } from 'express';
import express from 'express';
import { matchedData } from 'express-validator';
import { ErrorResponse, OntimeEntry, ProjectRundownsList, RenumberCues, Rundown } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { paramsWithId } from '../validation-utils/validationFunction.js';
import { getCurrentRundown, getProcessedRundown } from './rundown.dao.js';
import {
  addEntry,
  applyDelay,
  batchEditEntries,
  cloneEntry,
  createNewRundown,
  deleteAllEntries,
  deleteEntries,
  deleteRundown,
  duplicateRundown,
  editEntry,
  groupEntries,
  loadRundown,
  renameRundown,
  renumberEntries,
  reorderEntry,
  swapEvents,
  ungroupEntries,
} from './rundown.service.js';
import { normalisedToRundownArray } from './rundown.utils.js';
import {
  clonePostValidator,
  entryBatchPutValidator,
  entryPostValidator,
  entryPutValidator,
  entryRenumberValidator,
  entryReorderValidator,
  entrySwapValidator,
  rundownArrayOfIds,
  rundownPatchValidator,
  rundownPostValidator,
} from './rundown.validation.js';

export const router: Router = express.Router();

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
 * Returns a given rundown in its normalised client shape
 */
router.get('/:id', paramsWithId, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const rundown = getProcessedRundown(req.params.id);
    res.json(rundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(404).send({ message });
  }
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
    const projectRundowns = await createNewRundown(req.body.title);
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
      const projectRundowns = await duplicateRundown(req.params.id);
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
router.patch(
  '/:id',
  rundownPatchValidator,
  async (req: Request, res: Response<ProjectRundownsList | ErrorResponse>) => {
    try {
      const projectRundowns = await renameRundown(req.params.id, req.body.title);
      res.status(201).json({ loaded: getCurrentRundown().id, rundowns: normalisedToRundownArray(projectRundowns) });
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

/**
 * Deletes a rundown if not loaded
 */
router.delete('/:id', paramsWithId, async (req: Request, res: Response<ProjectRundownsList | ErrorResponse>) => {
  try {
    const newProjectRundowns = await deleteRundown(req.params.id);
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
  async (req: Request, res: Response<OntimeEntry | ErrorResponse>) => {
    try {
      const newEvent = await addEntry(req.params.rundownId, req.body);
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
router.put('/:rundownId/entry', entryPutValidator, async (req: Request, res: Response<OntimeEntry | ErrorResponse>) => {
  try {
    const event = await editEntry(req.params.rundownId, req.body);
    res.status(200).send(event);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

/**
 * Edits an entry in a given rundown
 */
router.put(
  '/:rundownId/batch',
  entryBatchPutValidator,
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const rundown = await batchEditEntries(req.params.rundownId, req.body.ids, req.body.data);
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
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const { entryId, destinationId, order } = req.body;
      const rundown = await reorderEntry(req.params.rundownId, entryId, destinationId, order);
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
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const rundown = await applyDelay(req.params.rundownId, req.params.id);
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
router.patch('/:rundownId/swap', entrySwapValidator, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const rundown = await swapEvents(req.params.rundownId, req.body.from, req.body.to);
    res.status(200).send(rundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

/**
 * Clones the contents of an entry into a new one
 */
router.post(
  '/:rundownId/clone/:id',
  paramsWithId,
  clonePostValidator,
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const rundown = await cloneEntry(req.params.rundownId, req.params.id, {
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
router.post('/:rundownId/group', rundownArrayOfIds, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const rundown = await groupEntries(req.params.rundownId, req.body.ids);
    res.status(200).send(rundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

/**
 * Dissolves a group by moving its children to the main rundown
 */
router.post('/:rundownId/ungroup/:id', paramsWithId, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const rundown = await ungroupEntries(req.params.rundownId, req.params.id);
    res.status(200).send(rundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

/**
 * Deletes a list of entries by their ID
 */
router.delete(
  '/:rundownId/entries',
  rundownArrayOfIds,
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const rundown = await deleteEntries(req.params.rundownId, req.body.ids);
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
router.delete('/:rundownId/all', async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const rundown = await deleteAllEntries(req.params.rundownId);
    res.status(200).send(rundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

/**
 * Reorders two entries in a rundown
 */
router.patch(
  '/:rundownId/renumber',
  entryRenumberValidator,
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const { ids, prefix, start, increment } = matchedData<RenumberCues>(req);
      const rundown = await renumberEntries(req.params.rundownId, ids, prefix, start, increment);
      res.status(200).send(rundown);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

// #endregion operations on rundown entries =======================
