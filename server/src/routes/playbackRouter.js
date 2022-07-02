import express from 'express';
export const router = express.Router();

// import playback controllers
import {
  pbGet,
  onAir,
  offAir,
  pbStart,
  pbPause,
  pbStop,
  pbRoll,
  pbPrevious,
  pbNext,
  pbLoad,
  pbUnload,
  pbReload,
} from '../controllers/playbackController.js';

// create route between controller and '/playback/' endpoint
router.get('/', pbGet);

// create route between controller and '/playback/onAir' endpoint
router.post('/onAir', onAir);

// create route between controller and '/playback/offAir' endpoint
router.post('/offAir', offAir);

// create route between controller and '/playback/start' endpoint
router.post('/start', pbStart);

// create route between controller and '/playback/pause' endpoint
router.post('/pause', pbPause);

// create route between controller and '/playback/stop' endpoint
router.post('/stop', pbStop);

// create route between controller and '/playback/roll' endpoint
router.post('/roll', pbRoll);

// create route between controller and '/playback/previous' endpoint
router.post('/previous', pbPrevious);

// create route between controller and '/playback/next' endpoint
router.post('/next', pbNext);

// create route between controller and '/playback/load' endpoint
router.post('/load', pbLoad);

// create route between controller and '/playback/unload' endpoint
router.post('/unload', pbUnload);

// create route between controller and '/playback/reload' endpoint
router.post('/reload', pbReload);
