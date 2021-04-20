const express = require('express');
const router = express.Router();

// import events controller
const eventsController = require('../controllers/eventsController');

// create route between controller and '/events' endpoint
router.get('/', eventsController.eventsGetAll);

// create route between controller and '/events/:id' endpoint
router.get('/:eventId', eventsController.eventsGetById);

// create route between controller and '/events/' endpoint
router.post('/', eventsController.eventsPost);

// create route between controller and '/events/:id' endpoint
router.put('/', eventsController.eventsPut);

// create route between controller and '/events/:id' endpoint
router.patch('/', eventsController.eventsPatch);

// create route between controller and '/events/:id' endpoint
router.delete('/:eventId', eventsController.eventsDelete);

module.exports = router;
