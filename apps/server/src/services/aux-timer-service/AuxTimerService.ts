import { SimpleDirection, SimpleTimerState } from 'ontime-types';

import { SimpleTimer } from '../../classes/simple-timer/SimpleTimer.js';
import { eventStore } from '../../stores/EventStore.js';

export type EmitFn = (state: SimpleTimerState) => void;
export type GetTimeFn = () => number;

export class AuxTimerService {
  private timer: SimpleTimer;
  private interval: NodeJS.Timeout | null = null;
  private emit: EmitFn;
  private getTime: GetTimeFn;

  constructor(emit: EmitFn, getTime: GetTimeFn) {
    this.timer = new SimpleTimer();
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
    return this.timer.setDirection(direction);
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
