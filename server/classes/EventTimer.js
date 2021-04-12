const Timer = require('./Timer');

/*
 * EventTimer adds functions specific to APP
 * namely:
 * - Presenter message, text and status
 * - Public message, text and status
 *
 */

class EventTimer extends Timer {
  presenter = {
    text: '',
    visible: false,
  };
  public = {
    text: '',
    visible: false,
  };

  selectedEvent = null;
  selectedEventId = null;
  numEvents = null;

  constructor() {
    super();
  }

  setupWithEventList(eventlist) {
    // filter only events
    const events = eventlist.filter((e) => e.type === 'event');

    const numEvents = events.length;
    if (numEvents < 1) return;

    // set general
    this._eventList = events;
    this.numEvents = numEvents;

    // load first event
    this.loadEvent(0);
  }

  loadEvent(eventIndex) {
    // set event specific
    const e = this._eventList[eventIndex];
    const start =
      e.timeStart == null || e.timeStart === '' ? 0 : new Date(e.timeStart);
    const end =
      e.timeEnd == null || e.timeEnd === '' ? 0 : new Date(e.timeEnd);

    this._resetTimers();
    this.duration = end - start;
    this.current = this.duration;
    this.selectedEvent = eventIndex;
    this.selectedEventId = e.id;
    
  }

  print() {
    // TODO: better formatting?
    return `
      Timer
      =========

      Playback
      ------------------------------
      state           = ${this.state}
      current         = ${this.current}
      duration        = ${this.duration}

      Options
      ------------------------------
      showNegative    = ${this.showNegative}

      Events
      ------------------------------
      selectedEvent   = ${this.selectedEvent}
      selectedEventId = ${this.selectedEventId}
      numEvents       = ${this.numEvents}

      Messages
      ------------------------------
      presenter text  = ${this.presenter.text}
      presenter vis   = ${this.presenter.visible}
      public text     = ${this.public.text}
      public vis      = ${this.public.visible}

      Private
      ------------------------------
      finishAt        = ${this._finishAt}
      startedAt       = ${this._startedAt}
      pausedAt        = ${this._pausedAt}
      pausedInterval  = ${this._pausedInterval}
      pausedTotal     = ${this._pausedTotal}
    `;
  }

  set presenterText(text) {
    this.presenter.text = text;
  }

  set presenterVisible(state) {
    this.presenter.visible = state;
  }

  set publicText(text) {
    this.public.text = text;
  }

  set publicVisible(state) {
    this.public.visible = state;
  }

  get presenter() {
    return this.presenter;
  }

  get public() {
    return this.public;
  }

  _getEventData() {}

  goto(eventIndex) {
    this.loadEvent(eventIndex);
  }

  roll() {
    console.log('roll: not yet implemented');
    return false;
    this.state = 'roll';
  }

  previous() {
    const gotoEvent = this.selectedEvent > 0 ? this.selectedEvent - 1 : 0;

    if (gotoEvent === this.selectedEvent) return;
    this.goto(gotoEvent);
  }

  next() {
    const gotoEvent =
      this.selectedEvent < this.numEvents - 1
        ? this.selectedEvent + 1
        : this.numEvents - 1;

    if (gotoEvent === this.selectedEvent) return;
    this.goto(gotoEvent);
  }
}

module.exports = EventTimer;
