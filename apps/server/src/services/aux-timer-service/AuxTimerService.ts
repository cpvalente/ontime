import { RuntimeStore, SimpleDirection, SimplePlayback } from 'ontime-types';

import { SimpleTimer } from '../../classes/simple-timer/SimpleTimer.js';
import { timerConfig } from '../../setup/config.js';
import { eventStore } from '../../stores/EventStore.js';

type AuxTimerStateUpdate = Partial<Pick<RuntimeStore, 'auxtimer1' | 'auxtimer2' | 'auxtimer3'>>;
type EmitFn = (state: AuxTimerStateUpdate) => void;
type GetTimeFn = () => number;

export class AuxTimerService {
  private aux1: SimpleTimer;
  private aux2: SimpleTimer;
  private aux3: SimpleTimer;
  private interval: NodeJS.Timeout | null = null;
  protected emit: EmitFn;
  private getTime: GetTimeFn;

  constructor(emit: EmitFn, getTime: GetTimeFn) {
    this.aux1 = new SimpleTimer(timerConfig.auxTimerDefault);
    this.aux2 = new SimpleTimer(timerConfig.auxTimerDefault);
    this.aux3 = new SimpleTimer(timerConfig.auxTimerDefault);
    this.emit = emit;
    this.getTime = getTime;
  }

  /**
   * Whether any of the aux timers are currently running
   */
  private hasActiveTimers(): boolean {
    return (
      this.aux1.state.playback === SimplePlayback.Start ||
      this.aux2.state.playback === SimplePlayback.Start ||
      this.aux3.state.playback === SimplePlayback.Start
    );
  }

  private startInterval() {
    if (!this.interval) {
      this.interval = setInterval(this.update.bind(this), 500);
    }
  }

  /**
   * Utility simplifies guarding against multiple intervals being set
   */
  private stopInterval() {
    if (this.interval && !this.hasActiveTimers()) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  @broadcastReturn
  setDirection(direction: SimpleDirection, index: number) {
    if (index === 1) return this.aux1.setDirection(direction, this.getTime());
    if (index === 2) return this.aux2.setDirection(direction, this.getTime());
    return this.aux3.setDirection(direction, this.getTime());
  }

  @broadcastReturn
  start(index: number) {
    this.startInterval();
    if (index === 1) return this.aux1.start(this.getTime());
    if (index === 2) return this.aux2.start(this.getTime());
    return this.aux3.start(this.getTime());
  }

  @broadcastReturn
  pause(index: number) {
    // First pause the timer
    let result;
    if (index === 1) result = this.aux1.pause(this.getTime());
    else if (index === 2) result = this.aux2.pause(this.getTime());
    else result = this.aux3.pause(this.getTime());

    // Then check if we need to keep the interval running
    if (!this.hasActiveTimers()) {
      this.stopInterval();
    }

    return result;
  }

  @broadcastReturn
  stop(index: number) {
    // First stop the timer
    let result;
    if (index === 1) result = this.aux1.stop();
    else if (index === 2) result = this.aux2.stop();
    else result = this.aux3.stop();

    // Then check if we need to keep the interval running
    if (!this.hasActiveTimers()) {
      this.stopInterval();
    }

    return result;
  }

  @broadcastReturn
  setTime(duration: number, index: number) {
    if (index === 1) return this.aux1.setTime(duration);
    if (index === 2) return this.aux2.setTime(duration);
    return this.aux3.setTime(duration);
  }

  @broadcastReturn
  addTime(millis: number, index: number) {
    const aux = index === 1 ? this.aux1 : index === 2 ? this.aux2 : this.aux3;
    if (aux.state.playback === SimplePlayback.Start) {
      aux.addTime(millis);
      return aux.update(this.getTime());
    }
    return aux.addTime(millis);
  }

  private update() {
    /**
     * The update function affects any running timers,
     * so we decide to emit a patch object rather
     * than using the decorator which would emit individual updates.
     */
    const patch: AuxTimerStateUpdate = {};

    const timeNow = this.getTime();
    if (this.aux1.state.playback === SimplePlayback.Start) {
      patch.auxtimer1 = this.aux1.update(timeNow);
    }

    if (this.aux2.state.playback === SimplePlayback.Start) {
      patch.auxtimer2 = this.aux2.update(timeNow);
    }

    if (this.aux3.state.playback === SimplePlayback.Start) {
      patch.auxtimer3 = this.aux3.update(timeNow);
    }

    if (Object.keys(patch).length > 0) {
      this.emit(patch);
    }
  }
}

function broadcastReturn(_target: object, _propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (this: AuxTimerService, ...args: unknown[]) {
    const result = originalMethod.apply(this, args);
    const index = args[args.length - 1] as number;
    this.emit({ [`auxtimer${index}`]: result });
    return result;
  };

  return descriptor;
}

const emit = (state: AuxTimerStateUpdate) => {
  for (const [key, value] of Object.entries(state)) {
    eventStore.set(key as keyof RuntimeStore, value);
  }
};
const timeNow = () => Date.now();

export const auxTimerService = new AuxTimerService(emit, timeNow);
