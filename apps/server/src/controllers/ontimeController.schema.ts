/**
 * @description Schema for filename for loading a project file.
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

/**
 * @description Validates object for POST /ontime/http
 */
export const httpSchema = {
  body: {
    type: 'object',
    required: ['enabledOut'],
    properties: {
      enabledOut: { type: 'boolean' },
      subscriptions: {
        type: 'object',
        properties: {
          onLoad: {
            type: 'array',
            maxItems: 3,
            items: { type: 'object', properties: { message: { type: 'string' } } },
          },
        },
      },
    },
  },
} as const;
