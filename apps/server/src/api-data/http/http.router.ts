import express from 'express';

import { validateHTTP } from './http.validation.js';
import { getHTTP, postHTTP } from './http.controller.js';

export const router = express.Router();

router.get('/', getHTTP);
router.post('/', validateHTTP, postHTTP);
