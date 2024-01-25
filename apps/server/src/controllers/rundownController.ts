import { publicProcedure } from '../trpc.js';

import * as rundown from '../services/rundown-service/RundownService.js';
import { getDelayedRundown, getRundownCache } from '../services/rundown-service/delayedRundown.utils.js';
import {
  addValidator,
  batchEditValidator,
  editValidator,
  eventId,
  reorderValidator,
  swapValidator,
} from './rundownController.validate.js';

import { router } from '../trpc.js';

const cache = publicProcedure.query(() => {
  return getRundownCache();
});

const all = publicProcedure.query(() => {
  return getDelayedRundown();
});

const addEvent = publicProcedure.input(addValidator).mutation(async ({ input }) => {
  return await rundown.addEvent(input);
});

const editEvent = publicProcedure.input(editValidator).mutation(async ({ input }) => {
  return await rundown.editEvent(input);
});

const batchEditEvents = publicProcedure.input(batchEditValidator).mutation(async ({ input }) => {
  const { ids, data } = input;
  return await rundown.batchEditEvents(ids, data);
});

const reorderEvent = publicProcedure.input(reorderValidator).mutation(async ({ input }) => {
  const { eventId, from, to } = input;
  return await rundown.reorderEvent(eventId, from, to);
});

const swapEvents = publicProcedure.input(swapValidator).mutation(async ({ input }) => {
  const { from, to } = input;
  return await rundown.swapEvents(from, to);
});

const applyDelay = publicProcedure.input(eventId).mutation(async ({ input }) => {
  return await rundown.applyDelay(input);
});

const deleteEvent = publicProcedure.input(eventId).mutation(async ({ input }) => {
  return await rundown.deleteEvent(input);
});

const deleteAllEvents = publicProcedure.mutation(async () => {
  return await rundown.deleteAllEvents();
});

export const rundownController = router({
  cache,
  all,
  batchEditEvents,
  addEvent,
  editEvent,
  reorderEvent,
  swapEvents,
  applyDelay,
  deleteEvent,
  deleteAllEvents,
});
