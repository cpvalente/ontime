import { SimpleDirection, SimplePlayback, SimpleTimerState } from 'ontime-types';

import { SimpleTimer } from '../../classes/simple-timer/SimpleTimer.js';
import { eventStore } from '../../stores/EventStore.js';
import { timerConfig } from '../../config/config.js';

export type EmitFn = (state: SimpleTimerState) => void;
export type GetTimeFn = () => number;

export class AuxTimerService {
  private timer: SimpleTimer;
  private interval: NodeJS.Timeout | null = null;
  private emit: EmitFn;
  private getTime: GetTimeFn;

  constructor(emit: EmitFn, getTime: GetTimeFn) {
    this.timer = new SimpleTimer(timerConfig.auxTimerDefault);
    this.emit = emit;
    this.getTime = getTime;
  }

  private startInterval() {
    this.interval = setInterval(this.update.bind(this), 500);
  }

  private stopInterval() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  @broadcastReturn
  setDirection(direction: SimpleDirection) {
    return this.timer.setDirection(direction, this.getTime());
  }

  @broadcastReturn
  start() {
    this.startInterval();
    return this.timer.start(this.getTime());
  }

  @broadcastReturn
  pause() {
    this.stopInterval();
    return this.timer.pause(this.getTime());
  }

  @broadcastReturn
  stop() {
    this.stopInterval();
    return this.timer.stop();
  }

  @broadcastReturn
  setTime(duration: number) {
    return this.timer.setTime(duration);
  }

  @broadcastReturn
  addTime(millis: number) {
    if (this.timer.state.playback === SimplePlayback.Start) {
      this.timer.addTime(millis);
      return this.timer.update(this.getTime());
    }
    return this.timer.addTime(millis);
  }

  @broadcastReturn
  private update() {
    return this.timer.update(this.getTime());
  }
}

function broadcastReturn(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const result = originalMethod.apply(this, args);
    this.emit(result);
    return result;
  };

  return descriptor;
}

const emit = (state: SimpleTimerState) => eventStore.set('auxtimer1', state);
const timeNow = () => Date.now();

export const auxTimerService = new AuxTimerService(emit, timeNow);
