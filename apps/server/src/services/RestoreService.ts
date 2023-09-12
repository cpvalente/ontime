import { Playback } from 'ontime-types';
import { logger } from '../classes/Logger.js';
import { PlaybackService } from './PlaybackService.js';
import { eventTimer } from './TimerService.js';
import { EventLoader } from '../classes/event-loader/EventLoader.js';

//File stuff
import fs from 'fs';
import { resolveDbDirectory } from '../setup.js'
import path from 'path';
import { Writer } from 'steno';

type OntimeState = {
    playback: Playback;
    selectedEventId: string | null;
    startedAt: number | null;
    addedTime: number | null;
    pausedAt: number | null
}

/**
 * Service manages saveing of timer state
 * that can then be resored when reopening
 */
export class RestoreService {
    private lastStore: string = '';
    private readonly file;
    private load: Partial<OntimeState> = { playback: Playback.Armed };
    private readonly ok;
    private readonly filePath;

    constructor(filePath: string) {
        this.filePath = filePath;
        try {
            const data = fs.readFileSync(path.join(filePath, 'RestoreService.csv'), 'utf-8');
            const elements = data.split(',');
            if (elements[5] == '\n') {
                logger.info('RESTORE', 'intact restore file');
                this.load.playback = elements[0] as Playback;
                this.load.selectedEventId = elements[1] != 'null' ? elements[1] : null;
                this.load.startedAt = elements[2] != 'null' ? +elements[2] : null;
                this.load.addedTime = elements[3] != 'null' ? +elements[3] : null;
                this.load.pausedAt = elements[4] != 'null' ? +elements[4] : null;
                this.ok = true;
            } else {
                this.ok = false;
            }
        } catch (err) {
            logger.info('RESTORE', 'faild to open RestoreService.csv, ' + err);
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
            this.file.write(newStore).catch((err) => { logger.error('RESTORE', err) });
        }
    }

    /**
    * try to restore timer state from csv
    */
    restore() {
        if (!this.ok) return;
        switch (restoreService.load?.playback) {
            case (Playback.Armed):
                PlaybackService.loadById(restoreService.load?.selectedEventId);
                break;
            case (Playback.Pause):
            case (Playback.Play):
                if (PlaybackService.loadById(restoreService.load?.selectedEventId)) {
                    const event = EventLoader.getEventWithId(restoreService.load?.selectedEventId);
                    eventTimer.hotReload(event, { startedAt: this.load?.startedAt }, this.load?.playback, this.load?.addedTime, this.load?.pausedAt);
                }
                break;
            case (Playback.Roll):
                PlaybackService.roll();
                break;
            default:
                logger.info('RESTORE', 'unknown Playback state');
                break;
        }
    }

    clear() {
        fs.unlinkSync(path.join(this.filePath, 'RestoreService.csv'));
    }
}

export const restoreService = new RestoreService(resolveDbDirectory);
