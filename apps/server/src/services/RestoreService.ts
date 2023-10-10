import { LogOrigin, Playback } from 'ontime-types';
import { logger } from '../classes/Logger.js';
import { EventLoader } from '../classes/event-loader/EventLoader.js';

//File stuff
import { unlinkSync, readFileSync } from 'fs';
import { Writer } from 'steno';
import { ensureFile } from '../utils/fileManagement.js';

/**
 * Service manages saveing of timer state
 * that can then be resored when reopening
 */
export class RestoreService {

    private static lastStore: string = '';
    private static file: Writer;

    static create(filePath: string) {
        let attempts = 0;
        do {
            try {
                ensureFile(filePath);
                RestoreService.file = new Writer(filePath);
                logger.info(LogOrigin.Server, `Restore file ensured`);
                return;
            } catch (error) {
                logger.info(LogOrigin.Server, `Could not ensure restore file attempt:${attempts+1} ${error}`);
                attempts++;
            }
        } while (attempts < 3);
        logger.error(LogOrigin.Server, `Could not ensure restore file after ${attempts+1} attempts`);
    }

    private static toNumberOrNull(elm: string): number | null {
        if (!elm) {
            throw new Error(`Element is empty`);
        } else if (elm === 'null') {
            return null;
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
    static async save(playback: Playback, selectedEventId: string | null, startedAt: number | null, addedTime: number | null, pausedAt: number | null) {
        if (this.file === undefined) {
            logger.error(LogOrigin.Server, `Can not save restore file before it is created`);
            return;
        }
        const newStore = `${playback},${selectedEventId},${startedAt},${addedTime},${pausedAt},\n`;
        if (newStore != RestoreService.lastStore) {
            RestoreService.lastStore = newStore;
            this.file.write(newStore).catch((err) => { logger.error(LogOrigin.Server, err) });
        }
    }

    static load(filePath: string) {
        let restorePoint = {
            playback: null,
            selectedEventId: null,
            startedAt: null,
            addedTime: null,
            pausedAt: null
        }
        try {
            const data = readFileSync(filePath, 'utf-8');
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

            if (!elements[1]) {
                throw new Error(`Element 1 is empty`);
            }
            const maybeId = elements[1] === 'null' ? null : elements[1];
            if (maybeId !== null && EventLoader.getEventWithId(maybeId) === undefined) {
                throw new Error(`Event ID dose not exits: ${maybeId}`);
            }
            restorePoint.selectedEventId = maybeId;

            restorePoint.startedAt = RestoreService.toNumberOrNull(elements[2]);
            restorePoint.addedTime = RestoreService.toNumberOrNull(elements[3]);
            restorePoint.pausedAt = RestoreService.toNumberOrNull(elements[4]);

            logger.info(LogOrigin.Server, 'Found resumable state');

        } catch (error) {
            logger.info(LogOrigin.Server, `Invalid restore state: ${error}`);
            return null;
        }
        return restorePoint;
    }

    static clear(filePath: string) {
        RestoreService.file = undefined;
        try {
            unlinkSync(filePath);
        } catch (error) {
            logger.error(LogOrigin.Server, `Failed to delete restore file: ${error}`);
        }
    }
}

