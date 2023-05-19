import express from 'express';
import {
  pbGet,
  pbLoad,
  pbNext,
  pbPause,
  pbPrevious,
  pbReload,
  pbRoll,
  pbStart,
  pbStop,
  pbUnload,
} from '../controllers/playbackController.js';

export const router = express.Router();

// create route between controller and '/playback/' endpoint
router.get('/', pbGet);

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

// router.post('*', (req, res) => res.return(404))
