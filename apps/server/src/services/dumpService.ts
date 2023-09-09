import { Playback, RuntimeStore } from 'ontime-types';
import { logger } from '../classes/Logger.js';
import fs from 'fs/promises';
import path from 'path';
import { type } from 'os';

type OntimeDump = {
    startedAt: number | null;
    playback: Playback;
    selectedEventId: string | null;
    addedTime: number | null;
}

let oldStore: string = '';

/**
 * Reloads information for currently running timer
 * @param {OntimeDump} store 
 * @param {string} dumpPath path to file
 * @param {number | null} store.startedAt
 * @param {Playback} store.playback
 * @param {string | null} store.selectedEventId
 * @param {number | null} store.addedTime
 */
export async function dump(store: Partial<OntimeDump>, dumpPath: string = __dirname + '/../../dump/test.json'): Promise<void> {
    const newStore = JSON.stringify(store);
    if (newStore != oldStore) {
        fs.appendFile(path.normalize(dumpPath), newStore + '\n', 'utf-8').
            catch((err) => { logger.error('DUMP', 'failde to dump state, ' + err) });
        oldStore = newStore;
        logger.info('DUMP', 'saving new state');
    }
}

export async function load(dumpPath: string = __dirname + '/../../dump/test.json'): Promise<Partial<OntimeDump>> {
    let s: Partial<OntimeDump> = {
        startedAt: null,
        playback: Playback.Armed,
        selectedEventId: null
    };

    try {
        const data = await fs.readFile(path.normalize(dumpPath), 'utf-8');
        const lines = data.split('\n');
        s = JSON.parse(lines[lines.length - 2]);
        await fs.unlink(path.normalize(dumpPath));
        return s;
    } catch (err) {
        logger.info('DUMP', 'faild to parse state file, ' + err);
        await fs.unlink(path.normalize(dumpPath));
        return s;
    }
}

//TODO: not tested
export async function clear(dumpPath: string = __dirname + '/../../dump/test.json'): Promise<void> {
    logger.info('DUMP', 'clearing dump file');
    await fs.unlink(path.normalize(dumpPath));
}