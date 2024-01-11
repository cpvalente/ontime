export type SimplePlayback = 'play' | 'pause' | 'stop';

export type SimpleTimerState = {
    duration: number;
    current: number;
    playback: SimplePlayback;
}

export class SimpleTimer {
    state: SimpleTimerState = {
        duration: 0,
        current: 0,
        playback: "stop",
    }
    private startedAt: number | null = null;
    private pausedAt: number | null = null;

    constructor() { }

    public reset() {
        this.state = {
            duration: 0,
            current: 0,
            playback: "stop",
        }
    }

    /**
     * Sets the duration of the timer
     * @param time - time in milliseconds
     */
    public setTime(time: number): SimpleTimerState {
        this.state.duration = time;
        this.state.current = time;
        return this.state;
    }

    public play(timeNow: number): SimpleTimerState {
        if (this.state.playback === 'pause') {
            const elapsedSincePause = this.pausedAt - this.startedAt;
            this.startedAt = timeNow - elapsedSincePause;
        } else if (this.state.playback === 'stop') {
            this.startedAt = timeNow;
        }
        this.state.playback = 'play';
        return this.update(timeNow);
    }

    public pause(timeNow: number): SimpleTimerState {
        this.state.playback = 'pause';
        this.pausedAt = timeNow;
        return this.state;
    }

    public stop(): SimpleTimerState {
        this.state.playback = 'stop';
        this.state.current = this.state.duration;
        this.startedAt = null;
        return this.state;
    }

    public update(timeNow: number): SimpleTimerState {
        if (this.state.playback === 'play') {
            const elapsed = timeNow - this.startedAt;
            this.state.current = this.state.duration - elapsed;
        }

        return this.state;
    }
}
