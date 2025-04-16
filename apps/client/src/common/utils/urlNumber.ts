import { MaybeString } from 'ontime-types';

export default function urlNumber(value: MaybeString, defaultValue: number = 0): number {
  if (value === null) return defaultValue;
  const number = Number(value);
  if (isNaN(number)) return defaultValue;
  return number;
}
