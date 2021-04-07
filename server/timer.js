class Timer {
  constructor(durationInSeconds) {
    const now = new Date().getTime();
    this.duration = durationInSeconds;
    this.current = durationInSeconds;
    this.finish = new Date().getTime() + durationInSeconds * 1000;
    this.started = now;
  }

  // update()
  update() {
    // doesnt include start time yet
    const now = new Date().getTime();
    this.current = (this.finish - now) * 0.001;
  }

  // getObject
  getObject() {
    this.update();
    return {
      duration: this.duration,
      current: this.current,
      finish: this.finish,
      started: this.started,
    };
  }

  // duration
  getDuration(durationInSeconds) {
    return this.duration;
  }
  setDuration() {
    try {
      this.duration = durationInSeconds;
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // current time in seconds
  getCurrentInSeconds() {
    // update timeStamp
    this.update();
    return this.current;
  }

  // playback
  start() {}
  pause() {}
  // playback
  stop() {}
}

module.exports = Timer;
