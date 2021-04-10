const express = require('express');
const router = express.Router();

// import playback controller
const eventsController = require('../controllers/eventsController');

// create route between controller and '/events' endpoint
router.get('/', eventsController.eventsGet);

// create route between controller and '/events/all' endpoint
router.get('/all', eventsController.eventsGetAll);

// create route between controller and '/events/:id' endpoint
router.get('/:id', eventsController.eventsGetById);

// create route between controller and '/events/' endpoint
router.post('/', eventsController.eventsPost);

// create route between controller and '/events/:id' endpoint
router.put('/', eventsController.eventsPut);

// create route between controller and '/events/:id' endpoint
router.patch('/', eventsController.eventsPatch);

// create route between controller and '/events/:id' endpoint
router.delete('/:id', eventsController.eventsDelete);

module.exports = router;
