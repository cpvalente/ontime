import { SupportedEvent } from 'ontime-types';

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

export const rundownPutSchema = {
  body: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
} as const;

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

export const paramsMustHaveEventIdSchema = {
  params: {
    type: 'object',
    required: ['eventId'],
    properties: {
      eventId: { type: 'string' },
    },
  },
} as const;
