// get environment vars
import 'dotenv/config.js';

import ua from 'universal-analytics';
import { nanoid } from 'nanoid';

export const sessionId = nanoid();
export const user = ua(process.env.ANALYTICS_ID);

// Track session
user.set('uid', sessionId);

// Allows filtering by the 'Application?' field in GA
user.set('ds', 'app');
