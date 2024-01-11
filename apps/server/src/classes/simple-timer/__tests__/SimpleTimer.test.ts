import { SimpleTimer } from '../SimpleTimer.js';

describe('SimpleTimer', () => {
    let timer: SimpleTimer;

    describe('normal timer flow', () => {
        const initialTime = 1000;
        timer = new SimpleTimer();

        test("setting the timer duration", () => {
            const newState = timer.setTime(initialTime);
            expect(newState).toStrictEqual({
                duration: initialTime,
                current: null,
                playback: 'stop',
            });
        })

        test("setting the timer to play", () => {
            const newState = timer.play(0)
            expect(newState).toStrictEqual({
                duration: initialTime,
                current: 0,
                playback: 'play',
            });
        })

        test("updating the timer", () => {
            let newState = timer.update(100)
            expect(newState).toStrictEqual({
                duration: initialTime,
                current: 100,
                playback: 'play',
            });

            newState = timer.update(500)
            expect(newState).toStrictEqual({
                duration: initialTime,
                current: 500,
                playback: 'play',
            });

            newState = timer.update(1500)
            expect(newState).toStrictEqual({
                duration: initialTime,
                current: 1500,
                playback: 'play',
            });
        })

        test("pausing the time doesnt affect the current", () => {
            let newState = timer.pause(1500)
            expect(newState).toStrictEqual({
                duration: initialTime,
                current: 1500,
                playback: 'pause',
            });

            newState = timer.update(1600)
            expect(newState).toStrictEqual({
                duration: initialTime,
                current: 1500,
                playback: 'pause',
            });

            newState = timer.update(1700)
            expect(newState).toStrictEqual({
                duration: initialTime,
                current: 1500,
                playback: 'pause',
            });

            newState = timer.play(1700)
            expect(newState).toStrictEqual({
                duration: initialTime,
                current: 1500,
                playback: 'play',
            });

            newState = timer.update(1800)
            expect(newState).toStrictEqual({
                duration: initialTime,
                current: 1600,
                playback: 'play',
            });
        })

        test("stopping the timer clears the running data", () => {
            const newState = timer.stop()
            expect(newState).toStrictEqual({
                duration: initialTime,
                current: null,
                playback: 'stop',
            });
        })

    })
});
