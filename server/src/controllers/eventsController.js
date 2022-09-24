// get database
import { data, db } from '../app.js';

// utils
import {
  block as blockDef,
  delay as delayDef,
  event as eventDef,
} from '../models/eventsDefinition.js';
import { generateId } from '../utils/generate_id.js';
import { MAX_EVENTS } from '../settings.js';
import { getPreviousPlayable } from '../utils/eventUtils.js';

async function _insertAndSync(newEvent) {
  if (newEvent.order) {
    const events = data.events;
    await _insertAt(newEvent, newEvent.order);
    const previousId = events?.[newEvent.order - 1]?.id;
    _insertEventInTimerAfterId(newEvent, previousId);
  } else if (newEvent.after) {
    await _insertAfterId(newEvent, newEvent.after);
    _insertEventInTimerAfterId(newEvent, newEvent.after);
  } else {
    await _insertAt(newEvent, 0);
    _insertEventInTimerAfterId(newEvent);
  }
}

/**
 * Insets an event after a given index
 * @param entry
 * @param index
 * @return {Promise<void>}
 * @private
 */
async function _insertAt(entry, index) {
  // get events
  const events = data.events;
  const count = events.length;
  const order = entry.order;

  // Remove order field from object
  delete entry.order;

  // Insert at beginning
  if (order === 0) {
    events.unshift(entry);
  }

  // insert at end
  else if (order >= count) {
    events.push(entry);
  }

  // insert in the middle
  else {
    events.splice(index, 0, entry);
  }

  // save events
  data.events = events;
  await db.write();
}

/**
 * @description Inserts an entry after an element with given Id
 * @param entry
 * @param id
 * @return {Promise<void>}
 * @private
 */
async function _insertAfterId(entry, id) {
  const index = [...data.events].findIndex((event) => event.id === id);
  await _insertAt(entry, index + 1);
}

/**
 * @description deletes an event from the db given its id
 * @param eventId
 * @return {Promise<void>}
 */
async function _removeById(eventId) {
  data.events = Array.from(data.events).filter((e) => e.id !== eventId);
  await db.write();
}

/**
 * @description returns all events of type event
 * @return {unknown[]}
 */
function getEventEvents() {
  // return data.events.filter((e) => e.type === 'event');
  return Array.from(data.events).filter((e) => e.type === 'event');
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
  if (typeof previousId === 'undefined') {
    global.timer.insertEventAtStart(event);
  } else {
    try {
      global.timer.insertEventAfterId(event, previousId);
    } catch (error) {
      global.timer.error('SERVER', `Unable to update object: ${error}`);
    }
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

// Create controller for GET request to '/events'
// Returns -
export const eventsGetAll = async (req, res) => {
  res.json(data.events);
};

// Create controller for GET request to '/events/:eventId'
// Returns -
export const eventsGetById = async (req, res) => {
  const id = req.params?.eventId;

  if (id == null) {
    res.status(400).send(`No eventId found in request`);
  } else {
    const event = data.events.find((e) => e.id === id);
    res.json(event);
  }
};

// Create controller for POST request to '/events/'
// Returns -
export const eventsPost = async (req, res) => {
  // TODO: Validate event
  if (!req.body) {
    res.status(400).send(`No object found in request`);
    return;
  }

  if (data.events.length > MAX_EVENTS) {
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
    _insertAndSync(newEvent);
    res.sendStatus(201);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for PUT request to '/events/'
// Returns -
export const eventsPut = async (req, res) => {
  // no valid params
  if (!req.body) {
    res.status(400).send(`No object found`);
    return;
  }

  const eventId = req.body.id;
  if (!eventId) {
    res.status(400).send(`Object malformed: id missing`);
    return;
  }

  const eventIndex = data.events.findIndex((e) => e.id === eventId);
  if (eventIndex === -1) {
    res.status(400).send(`No Id found found`);
    return;
  }

  try {
    const e = data.events[eventIndex];
    data.events[eventIndex] = { ...e, ...req.body };
    data.events[eventIndex].revision++;
    await db.write();

    if (data.events[eventIndex].skip) {
      _deleteTimerId(eventId);
      // if it is a skip, i make sure it is deleted from timer
      // event id might already not exist
    } else {
      try {
        _updateTimersSingle(eventId, req.body);
      } catch (error) {
        if (error === 'Event not found') {
          const { id: previousId } = getPreviousPlayable(data.events, e.id);
          _insertEventInTimerAfterId(data.events[eventIndex], previousId);
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for PATCH request to '/events/'
// Returns -
// DEPRECATED
export const eventsPatch = async (req, res) => {
  // Code is the same as put, call that
  await eventsPut(req, res);
};

export const eventsReorder = async (req, res) => {
  // TODO: Validate event
  if (!req.body) {
    res.status(400).send(`No object found in request`);
    return;
  }

  const { index, from, to } = req.body;

  // get events
  const events = data.events;
  const idx = events.findIndex((e) => e.id === index, from);

  // Check if item is at given index
  if (idx !== from) {
    res.status(400).send(`Id not found at index`);
    return;
  }

  try {
    // remove item at from
    const [reorderedItem] = events.splice(from, 1);

    // reinsert item at to
    events.splice(to, 0, reorderedItem);

    // save events
    data.events = events;
    await db.write();

    // update timer
    _updateTimers();

    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for PATCH request to '/events/applydelay/:eventId'
// Returns -
export const eventsApplyDelay = async (req, res) => {
  // no valid params
  if (!req.params.eventId) {
    res.status(400).send(`No id found in request`);
    return;
  }

  try {
    // get events
    const events = data.events;

    // AUX
    let delayIndex = null;
    let blockIndex = null;
    let delayValue = 0;

    for (const [index, e] of events.entries()) {
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
    events.splice(delayIndex, 1);

    // delete block
    // index would have moved down since we deleted delay
    if (blockIndex) events.splice(blockIndex - 1, 1);

    // update events
    data.events = events;
    await db.write();

    // update timer
    _updateTimers();

    res.sendStatus(201);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for DELETE request to '/events/:eventId'
// Returns -
export const eventsDelete = async (req, res) => {
  // no valid params
  if (!req.params.eventId) {
    res.status(400).send(`No id found in request`);
    return;
  }

  try {
    // remove new event
    await _removeById(req.params.eventId);

    // update timer
    _deleteTimerId(req.params.eventId);

    res.sendStatus(201);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for DELETE request to '/events/:eventId'
// Returns -
export const eventsDeleteAll = async (req, res) => {
  try {
    // set with nothing
    data.events = [];
    await db.write();

    // update timer object
    global.timer.clearEventList();

    res.sendStatus(201);
  } catch (error) {
    res.status(400).send(error);
  }
};
