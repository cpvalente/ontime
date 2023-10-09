import { RestoreService } from '../RestoreService.js';
import { LogOrigin, Playback } from 'ontime-types';
import { logger } from '../../classes/Logger.js';
import { eventLoader } from '../../classes/event-loader/EventLoader.js';
import fs from 'fs';
import { getAppDataPath } from '../../setup.js';

describe('load()', () => {
    const loggereMock = vi.spyOn(logger, 'info').mockImplementation(() => undefined);

    eventLoader.init();


    it('loads working file with times', () => {
        const newStore = `play,d3eb1,1234,5678,9087,\n`;
        fs.writeFileSync('./testRestore.csv', newStore, 'utf-8');
        const testLoad = RestoreService.load('./testRestore.csv');
        const expected = {
            playback: Playback.Play,
            selectedEventId: 'd3eb1',
            startedAt: 1234,
            addedTime: 5678,
            pausedAt: 9087
        };
        expect(testLoad).toStrictEqual(expected);
        expect(loggereMock).toHaveBeenLastCalledWith(LogOrigin.Server, 'Found resumable state');
        fs.unlinkSync('./testRestore.csv');
    });

    it('loads working file without times', () => {
        const newStore = `stop,null,null,null,null,\n`;
        fs.writeFileSync('./testRestore.csv', newStore, 'utf-8');
        const testLoad = RestoreService.load('./testRestore.csv');
        const expected = {
            playback: Playback.Stop,
            selectedEventId: null,
            startedAt: null,
            addedTime: null,
            pausedAt: null
        };
        expect(testLoad).toStrictEqual(expected);
        expect(loggereMock).toHaveBeenLastCalledWith(LogOrigin.Server, 'Found resumable state');
        fs.unlinkSync('./testRestore.csv');
    });

    it('dose not load missing newline', () => {
        const newStore = `play,d3eb1,1234,1234,1234,`;
        fs.writeFileSync('./testRestore.csv', newStore, 'utf-8');
        const testLoad = RestoreService.load('./testRestore.csv');
        const expected = null;
        expect(testLoad).toStrictEqual(expected);
        expect(loggereMock).toHaveBeenLastCalledWith(LogOrigin.Server, 'Invalid restore state: Error: Missing newline character in restore file');
        fs.unlinkSync('./testRestore.csv');
    });

    it('dose not load wrong play state', () => {
        const newStore = `Play,d3eb1,1234,1234,1234,\n`;
        fs.writeFileSync('./testRestore.csv', newStore, 'utf-8');
        const testLoad = RestoreService.load('./testRestore.csv');
        const expected = null;
        expect(testLoad).toStrictEqual(expected);
        expect(loggereMock).toHaveBeenLastCalledWith(LogOrigin.Server, 'Invalid restore state: Error: Could not phrase element to Playback state: Play');
        fs.unlinkSync('./testRestore.csv');
    });

    it('dose not load non existing ID', () => {
        const newStore = `play,abcd,1234,1234,1234,\n`;
        fs.writeFileSync('./testRestore.csv', newStore, 'utf-8');
        const testLoad = RestoreService.load('./testRestore.csv');
        const expected = null;
        expect(testLoad).toStrictEqual(expected);
        expect(loggereMock).toHaveBeenLastCalledWith(LogOrigin.Server, 'Invalid restore state: Error: Event ID dose not exits: abcd');
        fs.unlinkSync('./testRestore.csv');
    });

    it('dose not load wrong numbers', () => {
        const newStore = `play,d3eb1,bad,1234,1234,\n`;
        fs.writeFileSync('./testRestore.csv', newStore, 'utf-8');
        const testLoad = RestoreService.load('./testRestore.csv');
        const expected = null;
        expect(testLoad).toStrictEqual(expected);
        expect(loggereMock).toHaveBeenLastCalledWith(LogOrigin.Server, 'Invalid restore state: Error: Could not phrase element to number: bad');
        fs.unlinkSync('./testRestore.csv');
    });

    it('dose not load empty numbers', () => {
        const newStore = `play,d3eb1,,1234,1234,\n`;
        fs.writeFileSync('./testRestore.csv', newStore, 'utf-8');
        const testLoad = RestoreService.load('./testRestore.csv');
        const expected = null;
        expect(testLoad).toStrictEqual(expected);
        expect(loggereMock).toHaveBeenLastCalledWith(LogOrigin.Server, 'Invalid restore state: Error: Element is empty');
        fs.unlinkSync('./testRestore.csv');
    });

    it('dose not load missing file', () => {
        const testLoad = RestoreService.load('./testRestore.csv');
        const expected = null;
        expect(testLoad).toStrictEqual(expected);
        expect(loggereMock).toHaveBeenLastCalledWith(LogOrigin.Server, 'Invalid restore state: Error: ENOENT: no such file or directory, open \'./testRestore.csv\'');
    });



});


describe('create/clear()', () => {
    const testFolder = getAppDataPath() + '/test'
    const testFile = testFolder + '/test.csv'
    it('creates and remove file', () => {
        RestoreService.create(testFile);
        expect(fs.existsSync(testFile)).toStrictEqual(true);
        RestoreService.clear(testFile);
        expect(fs.existsSync(testFile)).toStrictEqual(false);
        fs.rmSync(testFolder, { recursive: true, force: true });
    });
});