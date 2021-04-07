const express = require('express');
const cors = require('cors');
const router = express.Router();

// Cross origin stuff
const corsOptions = {
  origin: 'http://localhost',
}

// import playback controller
const eventsController = require('../controllers/eventsController');

// create route between controller and '/events' endpoint
router.get('/', cors(corsOptions), eventsController.eventsGet);

// create route between controller and '/events/all' endpoint
router.get('/all', cors(corsOptions), eventsController.eventsGetAll);

module.exports = router;
