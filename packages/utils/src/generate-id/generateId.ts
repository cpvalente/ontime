import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890abcdef', 6);

/**
 * Generates a random id from the defined alphabet
 */
export const generateId = (): string => nanoid();
