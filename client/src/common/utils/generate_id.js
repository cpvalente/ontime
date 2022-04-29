import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('1234567890abcdef', 5);

/**
 * @description generates a random id from the defined alphabet
 * @return {string}
 */
export const generateId = () => nanoid();
