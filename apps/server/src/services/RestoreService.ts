import { LogOrigin, Playback } from 'ontime-types';
import { logger } from '../classes/Logger.js';
import { PlaybackService } from './PlaybackService.js';
import { eventTimer } from './TimerService.js';
import { EventLoader } from '../classes/event-loader/EventLoader.js';

//File stuff
import fs from 'fs';
import { resolveDbDirectory } from '../setup.js'
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
    private readonly ok;
    private readonly filePath;

    constructor(filePath: string) {
        this.filePath = filePath;
        try {
            const data = fs.readFileSync(path.join(filePath, 'RestoreService.csv'), 'utf-8');
            const elements = data.split(',');
            if (elements[5] == '\n') {
                logger.info(LogOrigin.Server, 'intact restore file');
                this.playback = elements[0] as Playback;
                this.selectedEventId = elements[1] != 'null' ? elements[1] : null;
                this.startedAt = elements[2] != 'null' ? +elements[2] : null;
                this.addedTime = elements[3] != 'null' ? +elements[3] : null;
                this.pausedAt = elements[4] != 'null' ? +elements[4] : null;
                this.ok = true;
            } else {
                this.ok = false;
            }
        } catch (err) {
            logger.info(LogOrigin.Server, 'faild to open RestoreService.csv, ' + err);
            this.ok = false;
        }
        this.file = new Writer(path.join(filePath, 'RestoreService.csv'));
    }

    /**
    * @param {Playback} playback
    * @param {string} selectedEventId
    * @param {number} startedAt
    * @param {number} addedTime
    * @param {number} pausedAt
    */
    async save(playback: Playback, selectedEventId: string | null, startedAt: number | null, addedTime: number | null, pausedAt: number | null) {
        const newStore = playback + ',' + selectedEventId + ',' + startedAt + ',' + addedTime + ',' + pausedAt + ',\n';
        if (newStore != this.lastStore) {
            this.lastStore = newStore;
            this.file.write(newStore).catch((err) => { logger.error(LogOrigin.Server, err) });
        }
    }

    /**
    * try to restore timer state from csv
    */
    restore() {
        if (!this.ok) return;
        switch (this.playback) {
            case (Playback.Armed):
                PlaybackService.loadById(this.selectedEventId);
                break;
            case (Playback.Pause):
            case (Playback.Play):
                if (PlaybackService.loadById(this.selectedEventId)) {
                    const event = EventLoader.getEventWithId(this.selectedEventId);
                    eventTimer.hotReload(event, { startedAt: this.startedAt }, this.playback, this.addedTime, this.pausedAt);
                }
                break;
            case (Playback.Roll):
                PlaybackService.roll();
                break;
            default:
                logger.info(LogOrigin.Server, 'unknown Playback state');
                break;
        }
    }

    clear() {
        fs.unlinkSync(path.join(this.filePath, 'RestoreService.csv'));
    }
}

export const restoreService = new RestoreService(resolveDbDirectory);
