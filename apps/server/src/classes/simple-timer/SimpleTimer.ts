import { MaybeNumber } from "ontime-types";

export type SimplePlayback = 'play' | 'pause' | 'stop';

export type SimpleTimerState = {
    duration: MaybeNumber;
    current: MaybeNumber;
    playback: SimplePlayback;
}

export class SimpleTimer {
    state: SimpleTimerState = {
        duration: 0,
        current: null,
        playback: "stop",
    }
    private startedAt: number | null = null;
    private pausedAt: number | null = null;

    constructor() { }

    public reset() {
        this.state = {
            duration: 0,
            current: null,
            playback: "stop",
        }
    }

    /**
     * Sets the duration of the timer
     * @param time - time in milliseconds
     */
    public setTime(time: number): SimpleTimerState {
        this.state.duration = time;
        return this.state;
    }

    public play(timeNow: number): SimpleTimerState {
        if (this.state.playback === 'pause') {
            this.startedAt = timeNow - (this.pausedAt - this.startedAt);
        } else if (this.state.playback === 'stop') {
            this.startedAt = timeNow;
        }
        this.state.playback = 'play';
        this.state.current = timeNow - this.startedAt;
        return this.state;
    }

    public pause(timeNow: number): SimpleTimerState {
        this.state.playback = 'pause';
        this.pausedAt = timeNow;
        return this.state;
    }

    public stop(): SimpleTimerState {
        this.state.playback = 'stop';
        this.state.current = null;
        return this.state;
    }

    public update(timeNow: number): SimpleTimerState {
        if (this.state.playback === 'play') {
            this.state.current = timeNow - this.startedAt;
        }
        return this.state;
    }
}
