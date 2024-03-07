import express from 'express';

import { getHTTP, postHTTP } from './http.controller.js';

export const router = express.Router();

router.get('/', getHTTP);
router.post('/', postHTTP);
