import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890abcdef', 5);

/**
 * Generates a random id from the defined alphabet
 */
export const generateId = (): string => nanoid();
