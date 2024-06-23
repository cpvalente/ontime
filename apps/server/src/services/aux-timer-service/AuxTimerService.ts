import { DrivenTimerState, SimpleDirection, SimpleTimerState } from 'ontime-types';
import type { PublishFn } from '../../stores/EventStore.js';

import { SimpleTimer } from '../../classes/simple-timer/SimpleTimer.js';
import { eventStore } from '../../stores/EventStore.js';
import { throttle } from '../../utils/throttle.js';

export type EmitFn = (state: SimpleTimerState) => void;
export type GetTimeFn = () => number;

export class AuxTimerService {
  private timer: SimpleTimer;
  private interval: NodeJS.Timer | null = null;
  private emit: EmitFn;
  private getTime: GetTimeFn;

  constructor(emit: EmitFn, getTime: GetTimeFn) {
    this.timer = new SimpleTimer();
    this.emit = emit;
    this.getTime = getTime;

    this.throttledSetDriven = () => {
      throw new Error('Published called before initialisation');
    };
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

  init(publish: PublishFn) {
    this.publish = publish;
    this.throttledSetDriven = throttle((key, value) => this.publish?.(key, value), 100);
  }

  private throttledSetDriven: PublishFn;
  private publish: PublishFn | null;
  private drivenTimer: DrivenTimerState = { current: 0 };

  drive(time: number) {
    this.drivenTimer.current = time;
    console.log(time)
    this.throttledSetDriven('auxtimer2', this.drivenTimer);
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
