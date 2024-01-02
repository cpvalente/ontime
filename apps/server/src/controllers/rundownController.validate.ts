import { body, param, validationResult } from 'express-validator';
import { FastifySchema } from 'fastify';
import { SupportedEvent } from 'ontime-types';

const rundownPostValidator = [
  body('type').isString().exists().isIn(['event', 'delay', 'block']),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownPostSchema = {
  body: {
    type: 'object',
    required: ['type'],
    properties: {
      type: { type: 'string', enum: [SupportedEvent.Block, SupportedEvent.Delay, SupportedEvent.Event] },
      after: { type: 'string' },
      id: { type: 'string' },
    },
  },
} as const;

const rundownPutValidator = [
  body('id').isString().exists(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownPutSchema = {
  body: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
} as const;

const rundownReorderValidator = [
  body('eventId').isString().exists(),
  body('from').isNumeric().exists(),
  body('to').isNumeric().exists(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownReorderSchema = {
  body: {
    type: 'object',
    required: ['eventId', 'from', 'to'],
    properties: {
      eventId: { type: 'string' },
      from: { type: 'integer', minimum: 0 },
      to: { type: 'integer', minimum: 0 },
    },
  },
} as const;

const rundownSwapValidator = [
  body('from').isString().exists(),
  body('to').isString().exists(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownSwapSchema = {
  body: {
    type: 'object',
    required: ['from', 'to'],
    properties: {
      from: { type: 'string' },
      to: { type: 'string' },
    },
  },
} as const;

const paramsMustHaveEventId = [
  param('eventId').exists(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const paramsMustHaveEventIdSchema = {
  params: {
    type: 'object',
    required: ['eventId'],
    properties: {
      eventId: { type: 'string' },
    },
  },
} as const;
