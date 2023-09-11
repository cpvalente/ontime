import { Playback } from 'ontime-types';
import { logger } from '../classes/Logger.js';
import { PlaybackService } from './PlaybackService.js';
import { eventTimer } from './TimerService.js';
import { eventLoader } from '../classes/event-loader/EventLoader.js';

//File stuff
import fs from 'fs';
import { resolveDbDirectory } from '../setup.js'
import path from 'path';
import { Writer } from 'steno';

type OntimeDump = {
    playback: Playback;
    selectedEventId: string | null;
    startedAt: number | null;
    addedTime: number | null;
}

export class RestoreService {
    private lastStore: string = '';
    private readonly file;
    private load: Partial<OntimeDump> = { playback: Playback.Armed };
    private readonly ok;

    constructor(filePath: string) {
        try {
            const data = fs.readFileSync(path.join(filePath, 'RestoreService.csv'), 'utf-8');
            const elements = data.split(',');
            if (elements[4] == '\n') {
                logger.info('RESTORE', 'intact restore file');
                this.load.playback = elements[0] as Playback;
                this.load.selectedEventId = elements[1] != 'null' ? elements[1] : null;
                this.load.startedAt = elements[2] != 'null' ? +elements[2] : null;
                this.load.addedTime = elements[3] != 'null' ? +elements[3] : null;
                this.ok = true;
            } else {
                logger.error('RESTORE', 'file not intact');
                this.ok = false;
            }
        } catch (err) {
            logger.info('RESTORE', 'faild to open RestoreService.csv, ' + err);
            this.ok = false;
        }
        this.file = new Writer(path.join(filePath, 'RestoreService.csv'));
    }

    async save(data: Partial<OntimeDump>) {
        const newStore = data.playback + ',' + data.selectedEventId + ',' + data.startedAt + ',' + data.addedTime + ',\n';
        if (newStore != this.lastStore) {
            await this.file.write(newStore);
            this.lastStore = newStore;
        }
    }

    restore() {
        if (!this.ok) return;
        switch (restoreService.load?.playback) {
            case (Playback.Armed):
            case (Playback.Pause):
            case (Playback.Play):
                if (PlaybackService.loadById(restoreService.load?.selectedEventId)) {
                    eventTimer.hotReload(
                        eventLoader.getLoaded().loadedEvent,
                        { startedAt: restoreService.load?.startedAt },
                        restoreService.load?.playback, restoreService.load?.addedTime);
                }
                break;
            case (Playback.Roll):
                PlaybackService.roll();
                break;
            default:
                logger.info('RESTORE', 'nothing to load');
                break;
        }
    }
}

export const restoreService = new RestoreService(resolveDbDirectory);
