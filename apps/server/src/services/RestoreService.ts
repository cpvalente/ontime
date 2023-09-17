import { LogOrigin, Playback } from 'ontime-types';
import { logger } from '../classes/Logger.js';
import { PlaybackService } from './PlaybackService.js';
import { eventTimer } from './TimerService.js';
import { EventLoader } from '../classes/event-loader/EventLoader.js';

//File stuff
import { tmpdir } from 'os'
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
    private readonly hasValidData;
    private readonly filePath;

    constructor() {
        this.filePath = path.join(tmpdir(), 'ontime');
        if (!fs.existsSync(this.filePath)) {
            try {
                fs.mkdirSync(this.filePath);
            } catch (err) {
                logger.error(LogOrigin.Server, err);
                this.hasValidData = false;
                return;
            }
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

            const maybeId = elements[1] === 'null' ? null : elements[1];
            //TODO: Cannot access 'EventLoader' before initialization
            // if (maybeId && EventLoader.getEventWithId(maybeId)) { this.hasValidData = false; return; }
            this.selectedEventId = maybeId;

            this.startedAt = this.toNumberOrNull(elements[2]);
            this.addedTime = this.toNumberOrNull(elements[3]);
            this.pausedAt = this.toNumberOrNull(elements[4]);

            logger.info(LogOrigin.Server, 'Found resumable state');
            this.hasValidData = true;

        } catch (error) {
            logger.info(LogOrigin.Server, `Failed to restore state: ${error}`);
            this.hasValidData = false;
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

    /**
    * try to restore timer state from csv
    */
    restore() {
        if (!this.hasValidData) return;
        if (this.playback === Playback.Armed) {
            PlaybackService.loadById(this.selectedEventId);
        } else if (this.playback === Playback.Pause || this.playback === Playback.Play) {
            if (PlaybackService.loadById(this.selectedEventId)) {
                const event = EventLoader.getEventWithId(this.selectedEventId);
                eventTimer.init(event, this.playback, this.selectedEventId, this.startedAt, this.addedTime, this.pausedAt);
            }
        } else if (this.playback === Playback.Roll) {
            PlaybackService.roll();
        }
    }

    clear() {
        fs.unlinkSync(path.join(this.filePath, 'restore.csv'));
    }
}

export const restoreService = new RestoreService();
