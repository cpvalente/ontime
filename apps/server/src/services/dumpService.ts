import { RuntimeStore } from 'ontime-types';
import { logger } from '../classes/Logger.js';
import fs from 'fs/promises';
import path from 'path';


export async function dump(store: Partial<RuntimeStore>, dumpPath: string = __dirname + '/../../dump/test.json'): Promise<void> {
    fs.writeFile(path.normalize(dumpPath), JSON.stringify(store), 'utf-8').
        catch((err) => { logger.error('DUMP', 'failde to dump state, ' + err) });
}

export async function load(dumpPath: string = __dirname + '/../../dump/test.json'): Promise<Partial<RuntimeStore>> {
    let s: Partial<RuntimeStore> = {};
    try {
        const data = await fs.readFile(path.normalize(dumpPath), 'utf-8')
        s = JSON.parse(data);
        return s;
    } catch (err) {
        logger.info('DUMP', 'faild to parse state file, ' + err);
        return s;
    }
}