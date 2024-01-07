export const projectInfoSchema = {
  body: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      publicUrl: { type: 'string' },
      publicInfo: { type: 'string' },
      backstageUrl: { type: 'string' },
      backstageInfo: { type: 'string' },
      endMessage: { type: 'string' },
    },
  },
} as const;
