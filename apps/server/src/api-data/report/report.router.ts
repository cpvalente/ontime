import express from 'express';
import { getAll } from './report.controller.js';

export const router = express.Router();

router.get('/', getAll);

