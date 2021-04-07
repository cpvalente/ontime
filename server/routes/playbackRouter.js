const express = require('express');
const cors = require('cors');
const router = express.Router();

// Cross origin stuff
const corsOptions = {
  origin: 'http://localhost',
};

// import event controller
const playbackController = require('../controllers/playbackController');

// create route between controller and '/playback' endpoint
router.get('/', cors(corsOptions), playbackController.pbGet);

// create route between controller and '/playback/all' endpoint
router.get('/all', cors(corsOptions), playbackController.pbGetAll);

module.exports = router;
