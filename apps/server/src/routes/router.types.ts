import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import Fastify, { FastifyBaseLogger } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';

export type FastifyRouter = Fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse,
  FastifyBaseLogger,
  JsonSchemaToTsProvider
>;
