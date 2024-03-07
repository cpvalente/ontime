import express from 'express';
import { getAliases, postAliases } from './aliases.controller.js';

export const router = express.Router();

router.get('/', getAliases);
router.post('/', postAliases);
