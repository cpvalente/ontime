import { LogOrigin, Playback } from 'ontime-types';
import { logger } from '../classes/Logger.js';

//File stuff
import { getAppDataPath } from '../setup.js'
import fs from 'fs';
import path from 'path';
import { Writer } from 'steno';

/**
 * Service manages saveing of timer state
 * that can then be resored when reopening
 */
class RestoreService {
    private lastStore: string = '';
    private readonly file;
    private readonly filePath;

    constructor() {
        this.filePath = path.join(getAppDataPath(), 'restore.csv');
        if (!fs.existsSync(this.filePath)) {
            try {
                fs.writeFileSync(this.filePath, '', 'utf-8');
            } catch (error) {
                logger.error(LogOrigin.Server, `Could not create restore file ${error}`);
            }
            return;
        }
        this.file = new Writer(this.filePath);
    }

    private toNumberOrNull(elm: string): number | null {
        if (elm === null) {
            throw new Error(`Element is null`);
        } else if (elm === 'null') {
            return null;
        } else if (elm === '') {
            throw new Error(`Element is empty`);
        } else {
            const maybeNumber = Number(elm);
            if (isNaN(maybeNumber)) {
                throw new Error(`Could not phrase element to number: ${elm}`);
            }
            return maybeNumber;
        }
    }

    /**
    * @param {Playback} playback
    * @param {string} selectedEventId
    * @param {number} startedAt
    * @param {number} addedTime
    * @param {number} pausedAt
    */
    async save(playback: Playback, selectedEventId: string | null, startedAt: number | null, addedTime: number | null, pausedAt: number | null) {
        if (this.file === undefined) {
            logger.error(LogOrigin.Server, `Restore writer not created`)
        }
        const newStore = `${playback},${selectedEventId},${startedAt},${addedTime},${pausedAt},\n`;
        if (newStore != this.lastStore) {
            this.lastStore = newStore;
            this.file.write(newStore).catch((err) => { logger.error(LogOrigin.Server, err) });
        }
    }

    load() {
        let restorePoint = {
            playback: null,
            selectedEventId: null,
            startedAt: null,
            addedTime: null,
            pausedAt: null
        }
        try {
            const data = fs.readFileSync(this.filePath, 'utf-8');
            const elements = data.split(',');
            // we expect that a well terminated string, has a newline in the 5th element
            if (elements[5] !== '\n') {
                throw new Error(`Missing newline character in restore file`);
            }
            const maybePlayback = elements[0] as Playback
            if (!Object.values(Playback).includes(maybePlayback)) {
                throw new Error(`Could not phrase element to Playback state: ${elements[0]}`);
            }
            restorePoint.playback = maybePlayback;

            if (elements[1] === null) {
                throw new Error(`Element is null`);
            }
            const maybeId = elements[1] === 'null' ? null : elements[1];
            //We cannot access 'EventLoader' now to check the ID because it has not been initialized
            restorePoint.selectedEventId = maybeId;

            restorePoint.startedAt = this.toNumberOrNull(elements[2]);
            restorePoint.addedTime = this.toNumberOrNull(elements[3]);
            restorePoint.pausedAt = this.toNumberOrNull(elements[4]);

            logger.info(LogOrigin.Server, 'Found resumable state');

        } catch (error) {
            logger.info(LogOrigin.Server, `Failed to load restore state: ${error}`);
            return null;
        }
        return restorePoint;
    }

    clear() {
        if (fs.existsSync(this.filePath)) {
            fs.unlinkSync(this.filePath);
        }
    }
}

export const restoreService = new RestoreService();
