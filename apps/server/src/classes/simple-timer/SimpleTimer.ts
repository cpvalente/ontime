import { MaybeNumber } from "ontime-types";

export type SimplePlayback = 'play' | 'pause' | 'stop';
type EmitFn = (state: SimpleTimerState ) => void;

export type SimpleTimerState = {
    duration: MaybeNumber;
    current: MaybeNumber;
    playback: SimplePlayback;
}

export class SimpleTimer {    
    private state: SimpleTimerState = {
        duration: 0,
        current: null,
        playback: "stop",
    }

    private startedAt: number | null = null;
    private pausedAt: number | null = null;
    private emit: EmitFn;

    constructor(emit: EmitFn){
        // TODO: should we emit on constructor?
        this.emit = emit;
    }

    /**
     * Sets the duration of the timer
     * @param time - time in milliseconds
     */
    @broadcast
    public setTime(time: number){
        this.state.duration = time;
    }

    @broadcast
    public play({timeNow = Date.now()} = {}){
        if (this.state.playback === 'pause') {
            this.startedAt = timeNow - (this.pausedAt - this.startedAt);
        } else if (this.state.playback === 'stop'){
            this.startedAt = timeNow;
        }
        this.state.playback = 'play';
        this.state.current = timeNow - this.startedAt;
    }

    @broadcast
    public pause({timeNow = Date.now()} = {}){
        this.state.playback = 'pause';
        this.pausedAt = timeNow;
    }

    @broadcast
    public stop(){
        this.state.playback = 'stop';
        this.state.current = null;
    }

    @broadcast
    public update({timeNow = Date.now()} = {}){
        if (this.state.playback === 'play') {
            this.state.current = timeNow - this.startedAt;
        }
    }
}

function broadcast(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function(...args: any[]) {
        const result = originalMethod.apply(this, args);
        this.emit(this.state);
        return result;
    };

    return descriptor;
}
