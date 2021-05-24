import express from 'express';
export const router = express.Router();

// import event controller
import {
  getAll,
  post,
  titleGet,
  titlePost,
  publicInfoGet,
  publicInfoPost,
  backstageInfoGet,
  backstageInfoPost,
  urlGet,
  urlPost,
} from '../controllers/eventController.js';

// create route between controller and '/settings' endpoint
router.get('/', getAll);

// create route between controller and '/settings' endpoint
router.post('/', post);

// create route between controller and '/event/title' endpoint
router.get('/title', titleGet);

// create route between controller and '/event/title' endpoint
router.post('/title', titlePost);

// create route between controller and '/event/info' endpoint
router.get('/publicInfo', publicInfoGet);

// create route between controller and '/event/info' endpoint
router.post('/publicInfo', publicInfoPost);

// create route between controller and '/event/info' endpoint
router.get('/backstageInfo', backstageInfoGet);

// create route between controller and '/event/info' endpoint
router.post('/backstageInfo', backstageInfoPost);

// create route between controller and '/event/url' endpoint
router.get('/url', urlGet);

// create route between controller and '/event/url' endpoint
router.post('/url', urlPost);
