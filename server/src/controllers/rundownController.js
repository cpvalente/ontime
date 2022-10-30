import {
  block as blockDef,
  delay as delayDef,
  event as eventDef,
} from '../models/eventsDefinition.js';
import { generateId } from '../utils/generate_id.js';
import { MAX_EVENTS } from '../settings.js';
import { getPreviousPlayable } from '../utils/eventUtils.js';
import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { failEmptyObjects } from '../utils/routerUtils.js';
import { socketProvider } from '../classes/socket/SocketController.js';

// import socket provider
const socket = socketProvider;

async function _insertAndSync(newEvent) {
  const afterId = newEvent?.after;
  if (typeof afterId === 'undefined') {
    await DataProvider.insertEventAt(newEvent, 0);
    if (newEvent.type === 'event') {
      _insertEventInTimerAfterId(newEvent);
    }
  } else {
    delete newEvent.after;
    await DataProvider.insertEventAfterId(newEvent, afterId);
    if (newEvent.type === 'event') {
      const rundown = DataProvider.getRundown();
      const { id } = getPreviousPlayable(rundown, newEvent.id);
      _insertEventInTimerAfterId(newEvent, id);
    }
  }
}

/**
 * @description returns all events of type event
 * @return {unknown[]}
 */
function getEventEvents() {
  // return data.events.filter((e) => e.type === 'event');
  const rundown = DataProvider.getRundown();
  return Array.from(rundown).filter((e) => e.type === 'event');
}

// Updates timer object
function _updateTimers() {
  const results = getEventEvents();
  global.timer.updateEventList(results);
}

/**
 * @description Adds an event to the timer after an event with given id
 * @param {object} event
 * @param {string} [previousId]
 * @private
 */
function _insertEventInTimerAfterId(event, previousId) {
  try {
    global.timer.insertEventAfterId(event, previousId);
  } catch (error) {
    socket.error('SERVER', `Unable to update object: ${error}`);
  }
}

/**
 * @description Updates timer object single event
 * @param {string} id
 * @param {object} event
 * @private
 */
function _updateTimersSingle(id, event) {
  global.timer.updateSingleEvent(id, event);
}

// Delete a single entry in timer object
function _deleteTimerId(entryId) {
  global.timer.deleteId(entryId);
}

// Create controller for GET request to '/eventlist'
// Returns -
export const rundownGetAll = async (req, res) => {
  res.json(DataProvider.getRundown());
};

// Create controller for GET request to '/eventlist/:eventId'
// Returns -
export const getEventById = async (req, res) => {
  const id = req.params?.eventId;

  if (id == null) {
    res.status(400).send(`No eventId found in request`);
  } else {
    const event = DataProvider.getEventById(id);
    res.json(event);
  }
};

// Create controller for POST request to '/eventlist/'
// Returns -
export const rundownPost = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  const numEvents = DataProvider.getNumEvents();
  if (numEvents > MAX_EVENTS) {
    const error = `ERROR: Reached limit number of ${MAX_EVENTS} events`;
    res.status(400).send(error);
    return;
  }

  // ensure structure
  let newEvent = {};
  const id = generateId();

  switch (req.body.type) {
    case 'event':
      newEvent = { ...eventDef, ...req.body, id };
      break;
    case 'delay':
      newEvent = { ...delayDef, ...req.body, id };
      break;
    case 'block':
      newEvent = { ...blockDef, ...req.body, id };
      break;

    default:
      res.status(400).send(`Object type missing or unrecognised: ${req.body.type}`);
      break;
  }

  try {
    await _insertAndSync(newEvent);
    res.sendStatus(201);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for PUT request to '/eventlist/'
// Returns -
export const rundownPut = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  const eventDataFromRequest = req.body;
  const eventId = eventDataFromRequest.id;
  const eventInMemory = DataProvider.getEventById(eventId);

  if (typeof eventInMemory === 'undefined') {
    res.status(400).send(`No event with ID found`);
    return;
  }

  try {
    const patchedObject = await DataProvider.updateEventById(eventId, eventDataFromRequest);

    if (patchedObject.type === 'event') {
      if (patchedObject.skip) {
        // if it is a skip, make sure it is deleted from timer
        _deleteTimerId(patchedObject.id);
      } else {
        if (eventInMemory.skip) {
          // if it was skipped before we add it to the timer
          const rundown = DataProvider.getRundown();
          const { id } = getPreviousPlayable(rundown, patchedObject.id);
          _insertEventInTimerAfterId(patchedObject, id);
        } else {
          // otherwise update as normal
          _updateTimersSingle(patchedObject.id, patchedObject);
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const rundownReorder = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  const { index, from, to } = req.body;

  // get rundown
  const rundown = DataProvider.getRundown();
  const idx = rundown.findIndex((e) => e.id === index, from);

  // Check if item is at given index
  if (idx !== from) {
    res.status(400).send(`Id not found at index`);
    return;
  }

  try {
    // remove item at from
    const [reorderedItem] = rundown.splice(from, 1);

    // reinsert item at to
    rundown.splice(to, 0, reorderedItem);

    // save rundown
    await DataProvider.setEventData(rundown);

    // update timer
    _updateTimers();

    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for PATCH request to '/eventlist/applydelay/:eventId'
// Returns -
export const rundownApplyDelay = async (req, res) => {
  try {
    // get rundown
    const rundown = DataProvider.getRundown();

    // AUX
    let delayIndex = null;
    let blockIndex = null;
    let delayValue = 0;

    for (const [index, e] of rundown.entries()) {
      if (delayIndex == null) {
        // look for delay
        if (e.id === req.params.eventId && e.type === 'delay') {
          delayValue = e.duration;
          delayIndex = index;
        }
      }

      // apply delay value to all items until block or end
      else {
        if (e.type === 'event') {
          // update times
          e.timeStart += delayValue;
          e.timeEnd += delayValue;

          // increment revision
          e.revision += 1;
        } else if (e.type === 'block') {
          // save id and stop
          blockIndex = index;
          break;
        }
      }
    }

    // delete delay
    rundown.splice(delayIndex, 1);

    // delete block
    // index would have moved down since we deleted delay
    if (blockIndex) rundown.splice(blockIndex - 1, 1);

    // update rundown
    await DataProvider.setRundown(rundown);

    // update timer
    _updateTimers();

    res.sendStatus(201);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for DELETE request to '/eventlist/:eventId'
// Returns -
export const deleteEventById = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // remove new event
    await DataProvider.deleteEvent(eventId);
    // update timer
    _deleteTimerId(eventId);

    res.sendStatus(204);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for DELETE request to '/eventlist/:eventId'
// Returns -
export const rundownDelete = async (req, res) => {
  try {
    await DataProvider.clearRundown();
    global.timer.clearEventList();
    res.sendStatus(204);
  } catch (error) {
    res.status(400).send(error);
  }
};
