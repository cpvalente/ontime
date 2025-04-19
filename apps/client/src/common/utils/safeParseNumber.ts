import { MaybeString } from 'ontime-types';

export default function safeParseNumber(value: MaybeString, defaultValue: number = 0): number {
  if (!value) return defaultValue;
  const number = Number(value);
  if (isNaN(number)) return defaultValue;
  return number;
}
