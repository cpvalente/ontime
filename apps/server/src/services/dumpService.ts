import { RuntimeStore } from 'ontime-types';
import { logger } from '../classes/Logger.js';
import fs from 'fs/promises';
import path from 'path';

let lastStore: Partial<RuntimeStore> = {};

export async function dump(store: Partial<RuntimeStore>) {
    logger.info('DUMP', path.normalize(__dirname + '/../../dump'));
    fs.writeFile(path.normalize(__dirname + '/../../dump/test.json'), JSON.stringify(store), 'utf-8')
}