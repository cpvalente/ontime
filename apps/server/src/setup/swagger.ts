import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { integrationSwagger } from '../api-integration/integration.swagger.js';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Ontime API',
    version: '1.0.0',
    description: 'API for the Ontime server',
  },
  servers: [
    {
      url: 'http://localhost:3000',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/api-data/**/*.ts', './src/api-integration/**/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);

swaggerSpec.paths = { ...swaggerSpec.paths, ...integrationSwagger.paths };

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
