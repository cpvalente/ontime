import { SupportedEvent } from 'ontime-types';
import { enum_, object, unknown, string, array, number, never, minValue, parse, length } from 'valibot';

//TODO: improve the event filed validation

export const addValidator = (i: unknown) =>
  parse(object({ type: enum_(SupportedEvent) }, unknown()), i, { abortEarly: true });

export const editValidator = (i: unknown) => parse(object({ id: string() }, unknown()), i, { abortEarly: true });

export const batchEditValidator = (i: unknown) =>
  parse(object({ data: object({}), ids: array(string()) }, never()), i, { abortEarly: true });

export const reorderValidator = (i: unknown) =>
  parse(object({ eventId: string(), from: number([minValue(0)]), to: number([minValue(0)]) }, never()), i, {
    abortEarly: true,
  });

export const swapValidator = (i: unknown) =>
  parse(object({ from: string(), to: string() }, never()), i, { abortEarly: true });

export const eventId = (i) => parse(string([length(5)]), i);
