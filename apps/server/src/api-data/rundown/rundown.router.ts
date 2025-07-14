import {
  ErrorResponse,
  MessageResponse,
  OntimeEntry,
  ProjectRundownsList,
  Rundown,
  ProjectRundown,
} from 'ontime-types';
import { customFieldLabelToKey, getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';
import express from 'express';

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
  ungroupEntries,
} from './rundown.service.js';
import {
  rundownArrayOfIds,
  rundownBatchPutValidator,
  rundownPostValidator,
  rundownPutValidator,
  rundownReorderValidator,
  rundownSwapValidator,
} from './rundown.validation.js';
import { paramsWithId } from '../validation-utils/validationFunction.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { defaultRundown } from '../../models/dataModel.js';

export const router = express.Router();

/**
 * Returns all rundowns in the project
 */
router.get('/', async (_req: Request, res: Response<ProjectRundownsList>) => {
  const fullRundowns = getDataProvider().getProjectRundowns();
  const rundowns: ProjectRundown[] = Object.values(fullRundowns).map(({ id, flatOrder, title, revision }) => {
    //TODO: what are we expecting in the entries? just events or everything
    return { id, numEntries: flatOrder.length, title, revision };
  });
  const loaded = getCurrentRundown().id;

  res.json({ loaded, rundowns });
});

/**
 * Returns the current rundown
 */
router.get('/current', async (_req: Request, res: Response<Rundown>) => {
  const rundown = getCurrentRundown();
  res.json(rundown);
});

router.post('/', rundownPostValidator, async (req: Request, res: Response<OntimeEntry | ErrorResponse>) => {
  try {
    const newEvent = await addEntry(req.body);
    res.status(201).send(newEvent);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.put('/', rundownPutValidator, async (req: Request, res: Response<OntimeEntry | ErrorResponse>) => {
  try {
    const event = await editEntry(req.body);
    res.status(200).send(event);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.put('/batch', rundownBatchPutValidator, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const rundown = await batchEditEntries(req.body.ids, req.body.data);
    res.status(200).send(rundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.patch('/reorder', rundownReorderValidator, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const { entryId, destinationId, order } = req.body;
    const newRundown = await reorderEntry(entryId, destinationId, order);
    res.status(200).send(newRundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.patch('/swap', rundownSwapValidator, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const rundown = await swapEvents(req.body.from, req.body.to);
    res.status(200).send(rundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.patch('/applydelay/:id', paramsWithId, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const newRundown = await applyDelay(req.params.id);
    res.status(200).send(newRundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.post('/clone/:id', paramsWithId, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const newRundown = await cloneEntry(req.params.id);
    res.status(200).send(newRundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.post('/group', rundownArrayOfIds, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const newRundown = await groupEntries(req.body.ids);
    res.status(200).send(newRundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.post('/ungroup/:id', paramsWithId, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const newRundown = await ungroupEntries(req.params.id);
    res.status(200).send(newRundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.delete('/', rundownArrayOfIds, async (req: Request, res: Response<MessageResponse | ErrorResponse>) => {
  try {
    await deleteEntries(req.body.ids);
    res.status(204).send({ message: 'Events deleted' });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.delete('/all', async (_req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const rundown = await deleteAllEntries();
    res.status(204).send(rundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.get('/load/:id', paramsWithId, async (req: Request, res: Response<void | ErrorResponse>) => {
  try {
    if (req.params.id === getCurrentRundown().id) {
      res.status(400).send({ message: 'will not re-switch to the already loaded rundown' });
      return;
    }
    const dataProvider = getDataProvider();
    const rundown = dataProvider.getRundown(req.params.id);
    const customField = dataProvider.getCustomFields();
    await initRundown(rundown, customField);
    res.status(201).send();
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

//TODO: is this route getting confusing in its combination with entry editing
// what to call this endpoint
router.delete('/whole/:id', paramsWithId, async (req: Request, res: Response<void | ErrorResponse>) => {
  try {
    if (req.params.id === getCurrentRundown().id) {
      res.status(400).send({ message: 'will not delete loaded rundown' });
      return;
    }

    const dataProvider = getDataProvider();
    const fullRundowns = dataProvider.getProjectRundowns();

    if (Object.keys(fullRundowns).length <= 1) {
      //TODO: might never hit this as it is likely covered by the case of trying to delete the loaded rundown
      res.status(400).send({ message: 'will not delete the last rundown' });
      return;
    }

    if (!(req.params.id in fullRundowns)) {
      res.status(400).send({ message: 'id dose not exist' });
      return;
    }

    dataProvider.deleteRundown(req.params.id);
    res.status(204).send();
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.post('/new/:id', paramsWithId, async (req: Request, res: Response<void | ErrorResponse>) => {
  try {
    const title = req.params.id;
    const id = customFieldLabelToKey(title);
    if (req.params.id === getCurrentRundown().id) {
      res.status(400).send({ message: 'already exists' });
      return;
    }
    const emptyRundown = { ...defaultRundown, id, title };
    await getDataProvider().setRundown(id, emptyRundown);
    res.status(201).send();
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});
