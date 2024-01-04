import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import Fastify, { FastifyBaseLogger } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';


export type FastifyRouter = Fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse,
  FastifyBaseLogger,
  JsonSchemaToTsProvider
>;


export type ZodFastifyRouter = Fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse,
  FastifyBaseLogger,
  ZodTypeProvider
>;
