import { RuntimeStore } from 'ontime-types';
import { logger } from '../classes/Logger.js';
import fs from 'fs/promises';
import path from 'path';

const emptyStore: Partial<RuntimeStore> = {
    "timer": {
        "clock": null,
        "current": null,
        "elapsed": null,
        "expectedFinish": null,
        "addedTime": 0,
        "startedAt": null,
        "finishedAt": null,
        "secondaryTimer": null,
        "selectedEventId": null,
        "duration": null,
        "timerType": null,
        "endAction": null
    },
    "playback": null,
    "timerMessage": {
        "text": "",
        "visible": false,
        "timerBlink": false,
        "timerBlackout": false
    },
    "publicMessage": {
        "text": "",
        "visible": false
    },
    "lowerMessage": {
        "text": "",
        "visible": false
    },
    "onAir": false,
    "loaded": {
        "selectedEventIndex": null,
        "selectedEventId": null,
        "selectedPublicEventId": null,
        "nextEventId": null,
        "nextPublicEventId": null,
        "numEvents": 4
    },
    "titles": {
        "titleNow": null,
        "subtitleNow": null,
        "presenterNow": null,
        "noteNow": null,
        "titleNext": null,
        "subtitleNext": null,
        "presenterNext": null,
        "noteNext": null
    },
    "titlesPublic": {
        "titleNow": null,
        "subtitleNow": null,
        "presenterNow": null,
        "noteNow": null,
        "titleNext": null,
        "subtitleNext": null,
        "presenterNext": null,
        "noteNext": null
    }
}

export async function dump(store: Partial<RuntimeStore>, dumpPath: string = __dirname + '/../../dump/test.json'): Promise<void> {
    fs.writeFile(path.normalize(dumpPath), JSON.stringify(store), 'utf-8').
        catch((err) => { logger.error('DUMP', 'failde to dump state, ' + err) });
}

export async function load(dumpPath: string = __dirname + '/../../dump/test.json'): Promise<Partial<RuntimeStore>> {
    let s: Partial<RuntimeStore> = emptyStore;
    try {
        const data = await fs.readFile(path.normalize(dumpPath), 'utf-8')
        s = JSON.parse(data);
        return s;
    } catch (err) {
        logger.info('DUMP', 'faild to parse state file, ' + err);
        return s;
    }
}

//TODO: not tested
export async function clear(dumpPath: string = __dirname + '/../../dump/test.json'): Promise<void> {
    logger.info('DUMP', 'clearing dump file');
    await fs.unlink(path.normalize(dumpPath));
}