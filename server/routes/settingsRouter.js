const express = require('express');
const router = express.Router();

// import event controller
const settingsController = require('../controllers/settingsController');

// create route between controller and '/settings' endpoint
router.get('/', settingsController.getAll);

// create route between controller and '/settings' endpoint
router.post('/', settingsController.post);

// create route between controller and '/event/title' endpoint
router.get('/title', settingsController.titleGet);

// create route between controller and '/event/title' endpoint
router.post('/title', settingsController.titlePost);

// create route between controller and '/event/info' endpoint
router.get('/publicInfo', settingsController.publicInfoGet);

// create route between controller and '/event/info' endpoint
router.post('/publicInfo', settingsController.publicInfoPost);

// create route between controller and '/event/info' endpoint
router.get('/backstageInfo', settingsController.backstageInfoGet);

// create route between controller and '/event/info' endpoint
router.post('/backstageInfo', settingsController.backstageInfoPost);

// create route between controller and '/event/url' endpoint
router.get('/url', settingsController.urlGet);

// create route between controller and '/event/url' endpoint
router.post('/url', settingsController.urlPost);

module.exports = router;
