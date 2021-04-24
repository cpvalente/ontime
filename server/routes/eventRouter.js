const express = require('express');
const router = express.Router();

// import event controller
const eventController = require('../controllers/eventController');

// create route between controller and '/settings' endpoint
router.get('/', eventController.getAll);

// create route between controller and '/settings' endpoint
router.post('/', eventController.post);

// create route between controller and '/event/title' endpoint
router.get('/title', eventController.titleGet);

// create route between controller and '/event/title' endpoint
router.post('/title', eventController.titlePost);

// create route between controller and '/event/info' endpoint
router.get('/publicInfo', eventController.publicInfoGet);

// create route between controller and '/event/info' endpoint
router.post('/publicInfo', eventController.publicInfoPost);

// create route between controller and '/event/info' endpoint
router.get('/backstageInfo', eventController.backstageInfoGet);

// create route between controller and '/event/info' endpoint
router.post('/backstageInfo', eventController.backstageInfoPost);

// create route between controller and '/event/url' endpoint
router.get('/url', eventController.urlGet);

// create route between controller and '/event/url' endpoint
router.post('/url', eventController.urlPost);

module.exports = router;
