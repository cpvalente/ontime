import { initTRPC, inferAsyncReturnType } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createContext = ({ req, res }: trpcExpress.CreateExpressContextOptions) => {
  return {};
};

export type Context = inferAsyncReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create();

export const middleware = t.middleware;
export const router = t.router;

export const publicProcedure = t.procedure;
