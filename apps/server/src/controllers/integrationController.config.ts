import { coerceString, coerceNumber, coerceBoolean } from '../utils/coerceType.js';

const whitelistedPayload = {
  title: coerceString,
  subtitle: coerceString,
  presenter: coerceString,
  note: coerceString,
  cue: coerceString,

  duration: coerceNumber,

  isPublic: coerceBoolean,
  skip: coerceBoolean,

  colour: coerceString,
  user0: coerceString,
  user1: coerceString,
  user2: coerceString,
  user3: coerceString,
  user4: coerceString,
  user5: coerceString,
  user6: coerceString,
  user7: coerceString,
  user8: coerceString,
  user9: coerceString,
};

export function parse(field: string, value: unknown) {
  if (!whitelistedPayload.hasOwnProperty(field)) {
    throw new Error(`Field ${field} not permitted`);
  }
  const parserFn = whitelistedPayload[field];
  return parserFn(value);
}
