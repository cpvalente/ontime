import { SimpleTimer } from '../SimpleTimer.js';

describe('SimpleTimer', () => {
    let timer: SimpleTimer;

    describe('normal timer flow', () => {
        const emit = vi.fn()
        const initialTime = 1000;
        timer = new SimpleTimer(emit);

        test("setting the timer duration", () => {
            timer.setTime(initialTime);
            expect(emit).toHaveBeenCalledWith({
                duration: initialTime,
                current: null,
                playback: 'stop',
            });
        })

        test("setting the timer to play", () => {
            timer.play({ timeNow: 0 })
            expect(emit).toHaveBeenCalledWith({
                duration: initialTime,
                current: 0,
                playback: 'play',
            });
        })

        test("updating the timer", () => {
            timer.update({ timeNow: 100 })
            expect(emit).toHaveBeenCalledWith({
                duration: initialTime,
                current: 100,
                playback: 'play',
            });

            timer.update({ timeNow: 500 })
            expect(emit).toHaveBeenCalledWith({
                duration: initialTime,
                current: 500,
                playback: 'play',
            });

            timer.update({ timeNow: 1500 })
            expect(emit).toHaveBeenCalledWith({
                duration: initialTime,
                current: 1500,
                playback: 'play',
            });
        })

        test("pausing the time doesnt affect the current", () => {
            timer.pause({ timeNow: 1500 })
            expect(emit).toHaveBeenCalledWith({
                duration: initialTime,
                current: 1500,
                playback: 'pause',
            });

            timer.update({ timeNow: 1600 })
            expect(emit).toHaveBeenCalledWith({
                duration: initialTime,
                current: 1500,
                playback: 'pause',
            });

            timer.update({ timeNow: 1700 })
            expect(emit).toHaveBeenCalledWith({
                duration: initialTime,
                current: 1500,
                playback: 'pause',
            });

            timer.play({ timeNow: 1700 })
            expect(emit).toHaveBeenCalledWith({
                duration: initialTime,
                current: 1500,
                playback: 'play',
            });

            timer.update({ timeNow: 1800 })
            expect(emit).toHaveBeenCalledWith({
                duration: initialTime,
                current: 1600,
                playback: 'play',
            });
        })

        test("stopping the timer clears the running data", () => {
            timer.stop()
            expect(emit).toHaveBeenCalledWith({
                duration: initialTime,
                current: null,
                playback: 'stop',
            });
        })

    })
});
