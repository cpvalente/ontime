import { LogOrigin, Playback } from 'ontime-types';
import { logger } from '../classes/Logger.js';
import { EventLoader } from '../classes/event-loader/EventLoader.js';

//File stuff
import fs from 'fs';
import { Writer } from 'steno';

/**
 * Service manages saveing of timer state
 * that can then be resored when reopening
 */
export class RestoreService {

    private static lastStore: string = '';
    private static file: Writer;
    private static filePath: string;

    static create(filePath: string) {
        if (!fs.existsSync(filePath)) {
            try {
                fs.writeFileSync(filePath, '', 'utf-8');
            } catch (error) {
                throw new Error(`Could not create restore file ${error}`);
            }
        }
        RestoreService.file = new Writer(filePath);
    }

    private static toNumberOrNull(elm: string): number | null {
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
            const data = fs.readFileSync(filePath, 'utf-8');
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
                throw new Error(`Element 1 is null`);
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
            logger.info(LogOrigin.Server, `Failed to load restore state: ${error}`);
            return null;
        }
        return restorePoint;
    }

    static clear() {
        RestoreService.file = undefined;
        if (fs.existsSync(RestoreService.filePath)) {
            try {
                fs.unlinkSync(RestoreService.filePath);
            } catch (error) {
                logger.error(LogOrigin.Server, `Failed to delete restore file: ${error}`);
            }
        }
    }
}

