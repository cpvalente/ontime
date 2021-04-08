const express = require('express');
const router = express.Router();

// import event controller
const playbackController = require('../controllers/playbackController');

// create route between controller and '/playback' endpoint
router.get('/', playbackController.pbGet);

// create route between controller and '/playback/all' endpoint
router.get('/all', playbackController.pbGetAll);

// create route between controller and '/playback/start' endpoint
router.get('/start', playbackController.pbStart);

// create route between controller and '/playback/pause' endpoint
router.get('/pause', playbackController.pbPause);

// create route between controller and '/playback/stop' endpoint
router.get('/stop', playbackController.pbStop);

// create route between controller and '/playback/roll' endpoint
router.get('/roll', playbackController.pbRoll);

// create route between controller and '/playback/previous' endpoint
router.get('/previous',playbackController.pbPrevious);

// create route between controller and '/playback/next' endpoint
router.get('/next', playbackController.pbNext);

module.exports = router;
