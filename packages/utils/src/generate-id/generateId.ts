import { customAlphabet } from 'nanoid';

/**
 * Lowercase letters and digits without 0, 1, i, l and o, which are easily misread when typed into integrations
 * Ids are compared case-sensitively, so the alphabet avoids uppercase
 */
const alphabet = '23456789abcdefghjkmnpqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 6);

/**
 * Generates a random id from the defined alphabet
 */
export const generateId = (): string => nanoid();
