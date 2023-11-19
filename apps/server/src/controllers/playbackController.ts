import { PlaybackService } from '../services/PlaybackService.js';
import { eventStore } from '../stores/EventStore.js';

// Create controller for POST request to '/playback'
// Returns playback state
export const pbGet = async (req, res) => {
  res.send({ playback: eventStore.get('playback') });
};

// Create controller for POST request to '/playback/start'
// Starts timer object
export const pbStart = async (req, res) => {
  const { eventId, eventIndex } = req.query;
  if (eventId) {
    const success = PlaybackService.startById(eventId);
    success ? res.sendStatus(202) : res.status(400).send({ message: 'Invalid event ID' });
  } else if (eventIndex) {
    const index = Number(eventIndex);
    if (!isNaN(index)) {
      const success = PlaybackService.startByIndex(eventIndex - 1);
      success ? res.sendStatus(202) : res.status(400).send({ message: 'Invalid event index' });
    } else {
      res.status(400).send({ message: 'Invalid event index' });
    }
  } else {
    PlaybackService.start();
    res.sendStatus(202);
  }
};

// Create controller for POST request to '/playback/pause'
// Pauses timer object
export const pbPause = async (req, res) => {
  PlaybackService.pause();
  res.sendStatus(202);
};

// Create controller for POST request to '/playback/stop'
// Stops timer object
export const pbStop = async (req, res) => {
  PlaybackService.stop();
  res.sendStatus(202);
};

// Create controller for POST request to '/playback/roll'
// Sets timer object to roll mode
export const pbRoll = async (req, res) => {
  PlaybackService.roll();
  res.sendStatus(202);
};

// Create controller for POST request to '/playback/previous'
// Loads previous event
export const pbPrevious = async (req, res) => {
  PlaybackService.loadPrevious();
  res.sendStatus(202);
};

// Create controller for POST request to '/playback/next'
// Loads Next event
export const pbNext = async (req, res) => {
  PlaybackService.loadNext();
  res.sendStatus(202);
};

// Create controller for POST request to '/playback/load'
// Load requested event
export const pbLoad = async (req, res) => {
  const { eventId, eventIndex } = req.query;
  if (eventId) {
    const success = PlaybackService.loadById(eventId);
    success ? res.sendStatus(202) : res.status(400).send({ message: 'Invalid event ID' });
  } else if (eventIndex) {
    const index = Number(eventIndex);
    if (!isNaN(index)) {
      const success = PlaybackService.loadByIndex(eventIndex - 1);
      success ? res.sendStatus(202) : res.status(400).send({ message: 'Invalid event index' });
    } else {
      res.status(400).send({ message: 'Invalid event index' });
    }
  } else {
    res.status(400).send({ message: 'No event given' });
  }
};

// Create controller for POST request to '/playback/unload'
// Unloads any events
export const pbUnload = async (req, res) => {
  PlaybackService.stop();
  res.sendStatus(202);
};

// Create controller for POST request to '/playback/reload'
// Reloads current event
export const pbReload = async (req, res) => {
  PlaybackService.reload();
  res.sendStatus(202);
};
