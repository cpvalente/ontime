import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('1234567890abcdef', 4);

export const generateId = () => nanoid();
