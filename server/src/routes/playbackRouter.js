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
  pbUnload,
  pbReload,
} from '../controllers/playbackController.js';

// create route between controller and '/playback/' endpoint
router.get('/', pbGet);

// create route between controller and '/playback/onAir' endpoint
router.get('/onAir', onAir);

// create route between controller and '/playback/offAir' endpoint
router.get('/offAir', offAir);

// create route between controller and '/playback/start' endpoint
router.get('/start', pbStart);
router.get('/play', pbStart);

// create route between controller and '/playback/pause' endpoint
router.get('/pause', pbPause);

// create route between controller and '/playback/stop' endpoint
router.get('/stop', pbStop);

// create route between controller and '/playback/roll' endpoint
router.get('/roll', pbRoll);

// create route between controller and '/playback/previous' endpoint
router.get('/previous', pbPrevious);

// create route between controller and '/playback/next' endpoint
router.get('/next', pbNext);

// create route between controller and '/playback/unload' endpoint
router.get('/unload', pbUnload);

// create route between controller and '/playback/reload' endpoint
router.get('/reload', pbReload);
