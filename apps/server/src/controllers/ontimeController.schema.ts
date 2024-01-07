// import { TimerLifeCycle } from 'ontime-types';
export const projectPartialSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    properties: {
      rundown: { type: 'array' },
      project: { type: 'object' },
      settings: { type: 'object' },
      viewSettings: { type: 'object' },
      aliases: { type: 'object' },
      userFields: { type: 'object' },
      osc: { type: 'object' },
    },
  },
} as const;

/**
 * @description Schema object for POST /ontime/settings
 * TODO: how dose the express validator isPort work?
 * https://github.com/express-validator/express-validator/blob/6069db8df9cf9969e7f0ee887ba9da4bf67147b1/src/chain/validators.ts#L176
 */
export const settingsSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['timeFormat', 'language'],
    properties: {
      editorKey: { type: 'string', minLength: 0, maxLength: 4 },
      operatorKey: { type: 'string', minLength: 0, maxLength: 4 },
      timeFormat: { enum: ['12', '24'] },
      language: { type: 'string' },
      serverPort: { type: 'integer', minimum: 1024, maximum: 65535 },
    },
  },
} as const;

/**
 * @description Schema object for POST /ontime/views
 */
export const viewSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: [],
    properties: {
      overrideStyles: { type: 'boolean' },
      endMessage: { type: 'string' },
      normalColor: { type: 'string' },
      warningColor: { type: 'string' },
      dangerColor: { type: 'string' },
      warningThreshold: { type: 'integer', minimum: 0 },
      dangerThreshold: { type: 'integer', minimum: 0 },
    },
  },
} as const;

/**
 * @description Schema object for POST /ontime/aliases
 */
export const aliasesSchema = {
  body: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        alias: { type: 'string' },
        pathAndParams: { type: 'string' },
      },
    },
  },
} as const;

/**
 * @description Schema object for POST /ontime/userfields
 */
export const userFieldsSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['user0', 'user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9'],
    properties: {
      user0: { type: 'string' },
      user1: { type: 'string' },
      user2: { type: 'string' },
      user3: { type: 'string' },
      user4: { type: 'string' },
      user5: { type: 'string' },
      user6: { type: 'string' },
      user7: { type: 'string' },
      user8: { type: 'string' },
      user9: { type: 'string' },
    },
  },
} as const;

const oscSubscription = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['message', 'enabled'],
    properties: {
      message: { type: 'string' },
      enabled: { type: 'boolean' },
    },
  },
} as const;

/**
 * @description Validates object for POST /ontime/osc-subscriptions
 */
export const oscSubscriptionSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['onLoad', 'onStart', 'onPause', 'onStop', 'onUpdate', 'onFinish'],
    properties: {
      onLoad: oscSubscription,
      onStart: oscSubscription,
      onPause: oscSubscription,
      onStop: oscSubscription,
      onUpdate: oscSubscription,
      onFinish: oscSubscription,
    },
  },
} as const;

/**
 * @description Schema object for POST /ontime/osc
 */
export const oscSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['portIn', 'portOut', 'targetIP', 'enabledIn', 'enabledOut', 'subscriptions'],
    properties: {
      portIn: { type: 'integer', minimum: 1024, maximum: 65535 },
      portOut: { type: 'integer', minimum: 1024, maximum: 65535 },
      targetIP: { type: 'string', format: 'ipv4' },
      enabledIn: { type: 'boolean' },
      enabledOut: { type: 'boolean' },
      subscriptions: {
        type: 'object',
        additionalProperties: false,
        required: ['onLoad', 'onStart', 'onPause', 'onStop', 'onUpdate', 'onFinish'],
        properties: {
          onLoad: oscSubscription,
          onStart: oscSubscription,
          onPause: oscSubscription,
          onStop: oscSubscription,
          onUpdate: oscSubscription,
          onFinish: oscSubscription,
        },
      },
    },
  },
} as const;

const httpSubscription = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['message', 'enabled'],
    properties: {
      message: { type: 'string' },
      enabled: { type: 'boolean' },
    },
  },
} as const;

/**
 * @description Schema object for POST /ontime/http
 */
export const httpSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['enabledOut', 'subscriptions'],
    properties: {
      enabledOut: { type: 'boolean' },
      subscriptions: {
        type: 'object',
        additionalProperties: false,
        required: ['onLoad', 'onStart', 'onPause', 'onStop', 'onUpdate', 'onFinish'],
        properties: {
          onLoad: httpSubscription,
          onStart: httpSubscription,
          onPause: httpSubscription,
          onStop: httpSubscription,
          onUpdate: httpSubscription,
          onFinish: httpSubscription,
        },
      },
    },
  },
} as const;

/**
 * @description Schema the filename for loading a project file.
 */
export const loadProjectFileSchema = {
  body: {
    type: 'object',
    required: ['filename'],
    properties: {
      filename: { type: 'string' },
    },
  },
} as const;
