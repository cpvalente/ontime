export const integrationSwagger = {
  paths: {
    '/api/{action}': {
      get: {
        summary: 'Perform an action on the server',
        parameters: [
          {
            in: 'path',
            name: 'action',
            required: true,
            schema: {
              type: 'string',
              enum: [
                'version',
                'poll',
                'change',
                'message',
                'start',
                'pause',
                'stop',
                'reload',
                'roll',
                'load',
                'addtime',
                'auxtimer',
                'client',
                'offsetmode',
              ],
            },
          },
        ],
        responses: {
          200: {
            description: 'Success',
          },
        },
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
              },
            },
          },
        },
      },
    },
  },
};
