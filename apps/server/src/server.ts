import fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { version } from '../package.json';

export const server = fastify().withTypeProvider<TypeBoxTypeProvider>();

server.register(swagger, {
  swagger: {
    info: {
      title: 'Ontime API',
      description: 'API for Ontime',
      version,
    },
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
  },
});

server.register(swaggerUi, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: true,
  },
});
