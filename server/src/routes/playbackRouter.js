import express from 'express';
export const router = express.Router();

// import event controller
const playbackController = require('../controllers/playbackController');

// create route between controller and '/playback/' endpoint
router.get('/', playbackController.pbGet);

// create route between controller and '/playback/onAir' endpoint
router.get('/onAir', playbackController.onAir);

// create route between controller and '/playback/offAir' endpoint
router.get('/offAir', playbackController.offAir);

// create route between controller and '/playback/start' endpoint
router.get('/start', playbackController.pbStart);

// create route between controller and '/playback/pause' endpoint
router.get('/pause', playbackController.pbPause);

// create route between controller and '/playback/stop' endpoint
router.get('/stop', playbackController.pbStop);

// create route between controller and '/playback/roll' endpoint
router.get('/roll', playbackController.pbRoll);

// create route between controller and '/playback/previous' endpoint
router.get('/previous', playbackController.pbPrevious);

// create route between controller and '/playback/next' endpoint
router.get('/next', playbackController.pbNext);

// create route between controller and '/playback/unload' endpoint
router.get('/unload', playbackController.pbUnload);

// create route between controller and '/playback/reload' endpoint
router.get('/reload', playbackController.pbReload);
