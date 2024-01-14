import { SimpleTimerState } from 'ontime-types';

import { SimpleTimerUp } from '../../classes/simple-timer/SimpleTimerUp.js';
import { eventStore } from '../../stores/EventStore.js';
import { EventLoader, eventLoader } from '../../classes/event-loader/EventLoader.js';
import { getRollTimers } from '../rollUtils.js';
import { PlaybackService } from '../PlaybackService.js';

export type EmitFn = (state: SimpleTimerState) => void;
export type GetTimeFn = () => number;

export class ExtraTimerService {
  private timer: SimpleTimerUp;
  private interval: NodeJS.Timer;
  private emit: EmitFn;
  private getTime: GetTimeFn;
  private current: number = 0;

  public get time(): number {
    return this.current;
  }

  constructor(emit: EmitFn, getTime: GetTimeFn) {
    this.timer = new SimpleTimerUp();
    this.emit = emit;
    this.getTime = getTime;
  }

  private startInterval() {
    this.interval = setInterval(this.update.bind(this), 500);
  }

  private stopInterval() {
    clearInterval(this.interval);
  }

  @broadcastReturn
  play() {
    this.startInterval();
    return this.timer.play(this.getTime());
  }

  @broadcastReturn
  pause() {
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
    const time = this.timer.update(this.getTime());
    const events = EventLoader.getPlayableEvents();
    const { currentEvent } = getRollTimers(events, time.current);
    if (currentEvent && currentEvent.id !== eventLoader.eventNow?.id) {
      PlaybackService.startById(currentEvent.id);
    }
    this.current = time.current;
    return time;
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

const emit = (state: SimpleTimerState) => eventStore.set('timer1', state);
const timeNow = () => Date.now();

export const extraTimerService = new ExtraTimerService(emit, timeNow);
