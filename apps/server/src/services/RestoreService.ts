import { Playback } from 'ontime-types';
import { logger } from '../classes/Logger.js';
import fs from 'fs';
import path from 'path';

import { resolveDbDirectory } from '../setup.js'

import { Writer } from 'steno';

type OntimeDump = {
    playback: Playback;
    selectedEventId: string | null;
    startedAt: number | null;
    addedTime: number | null;
}

let oldStore: string = '';

export class RestoreService {
    private lastStore: string = '';
    private readonly file;
    readonly load: Partial<OntimeDump>;

    constructor(filePath: string) {
        let s: Partial<OntimeDump> = { playback: Playback.Armed };
        try {
            const data = fs.readFileSync(path.join(filePath, 'RestoreService.csv'), 'utf-8');
            const elements = data.split(',');
            if (elements[4] == '\n') {
                logger.info('RESTORE', 'intact restore file');
                s.playback = elements[0] as Playback;
                s.selectedEventId = elements[1] != 'null' ? elements[1] : null;
                s.startedAt = elements[2] != 'null' ? +elements[2] : null;
                s.addedTime = elements[3] != 'null' ? +elements[3] : null;
            } else {
                logger.error('RESTORE', 'file not intact');
            }
        } catch (err) {
            logger.info('RESTORE', 'faild to open RestoreService.csv, ' + err);
        }
        this.load = s;
        this.file = new Writer(path.join(filePath, 'RestoreService.csv'));
    }

    async save(data: Partial<OntimeDump>) {
        const newStore = data.playback + ',' + data.selectedEventId + ',' + data.startedAt + ',' + data.addedTime + ',\n';
        if (newStore != this.lastStore) {
            await this.file.write(newStore);
            this.lastStore = newStore;
        }
    }
}

export const restoreService = new RestoreService(resolveDbDirectory);
