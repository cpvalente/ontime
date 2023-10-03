import { LogOrigin, Playback } from 'ontime-types';
import { logger } from '../classes/Logger.js';
import { PlaybackService } from './PlaybackService.js';

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
    private playback: Playback;
    private selectedEventId: string | null;
    private startedAt: number | null;
    private addedTime: number | null;
    private pausedAt: number | null;
    private hasValidData;
    private readonly filePath;

    constructor() {
        this.filePath = getAppDataPath();
        if (!fs.existsSync(this.filePath)) {
            logger.error(LogOrigin.Server, `Could not open app path ${this.filePath}`);
            this.hasValidData = false;
            return;
        }

        try {
            const data = fs.readFileSync(path.join(this.filePath, 'restore.csv'), 'utf-8');
            const elements = data.split(',');
            // we expect that a well terminated string, has a newline in the 5th element
            if (elements[5] !== '\n') {
                throw new Error(`Missing newline character in restore file`);
            }
            const maybePlayback = elements[0] as Playback
            if (!Object.values(Playback).includes(maybePlayback)) {
                throw new Error(`Could not phrase element to Playback state: ${elements[0]}`);
            }
            this.playback = maybePlayback;

            if (elements[1] === null) {
                throw new Error(`Element is null`);
            }
            const maybeId = elements[1] === 'null' ? null : elements[1];
            //We cannot access 'EventLoader' now to check the ID because it has not been initialized
            this.selectedEventId = maybeId;

            this.startedAt = this.toNumberOrNull(elements[2]);
            this.addedTime = this.toNumberOrNull(elements[3]);
            this.pausedAt = this.toNumberOrNull(elements[4]);

            logger.info(LogOrigin.Server, 'Found resumable state');
            this.hasValidData = true;

        } catch (error) {
            logger.info(LogOrigin.Server, `Failed to load restore state: ${error}`);
            this.hasValidData = false;
            return;
        }
        this.file = new Writer(path.join(this.filePath, 'restore.csv'));
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
        const newStore = `${playback},${selectedEventId},${startedAt},${addedTime},${pausedAt},\n`;
        if (newStore != this.lastStore) {
            this.lastStore = newStore;
            this.file.write(newStore).catch((err) => { logger.error(LogOrigin.Server, err) });
        }
    }

    load() {
        if (!this.hasValidData) {
            return null;
        }
        return {
            playback: this.playback,
            selectedEventId: this.selectedEventId,
            startedAt: this.startedAt,
            addedTime: this.addedTime,
            pausedAt: this.pausedAt
        }
    }

    clear() {
        fs.unlinkSync(path.join(this.filePath, 'restore.csv'));
    }
}

export const restoreService = new RestoreService();
