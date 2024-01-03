import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { IncomingMessage } from 'http';
import { FastifyRequest, RouteGenericInterface, RawServerDefault } from 'fastify';

export type Request<T> = FastifyRequest<
  RouteGenericInterface,
  RawServerDefault,
  IncomingMessage,
  T,
  JsonSchemaToTsProvider
>;