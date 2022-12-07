import { Timer } from './Timer.js';
import { DAY_TO_MS, replacePlaceholder, updateRoll } from './classUtils.js';
import { OSCIntegration } from './integrations/Osc.js';
import { HTTPIntegration } from './integrations/Http.js';
import { cleanURL } from '../../utils/url.js';
import { EventLoader, eventLoader } from '../event-loader/EventLoader.js';

/*
 * Class EventTimer adds functions specific to APP
 * @extends Timer
 */
export class EventTimer extends Timer {
  /**
   * Instantiates an event timer object
   * @param {object} socket
   * @param {object} timerConfig
   * @param {object} [oscConfig]
   * @param {object} [httpConfig]
   */
  constructor(socket, timerConfig, oscConfig, httpConfig) {
    // call super constructor
    super();

    this.cycleState = {
      /* idle: before it is initialised */
      idle: 'idle',
      /* onLoad: when a new event is loaded */
      onLoad: 'onLoad',
      /* armed: when a new event is loaded but hasn't started */
      armed: 'armed',
      onStart: 'onStart',
      /* update: every update call cycle (1 x second) */
      onUpdate: 'onUpdate',
      onPause: 'onPause',
      onStop: 'onStop',
      onFinish: 'onFinish',
    };
    this.ontimeCycle = 'idle';
    this.prevCycle = null;

    // Socket Object
    this.socket = socket;

    // OSC Object
    this.osc = null;

    // HTTP Client Object
    this.http = null;

    // call general title reset
    this._resetSelection();

    // set recurrent emits
    this._interval = setInterval(() => this.runCycle(), timerConfig?.refresh || 1000);

    if (oscConfig != null) {
      this._initOscClient(oscConfig);
    }

    if (httpConfig != null) {
      this._initHTTPClient(httpConfig);
    }
  }

  /**
   * @description Shutdown process
   */
  shutdown() {
    clearInterval(this._interval);
    if (this.osc != null) {
      this.socket.info('TX', '... Closing OSC Client');
      this.osc.shutdown();
    }
    if (this.http != null) {
      this.socket.info('TX', '... Closing HTTP Client');
      this.http.shutdown();
    }
  }

  /**
   * Initialises OSC Integration object
   * @param {object} oscConfig
   * @private
   */
  _initOscClient(oscConfig) {
    this.osc = new OSCIntegration();
    const r = this.osc.init(oscConfig);
    r.success ? this.socket.info('TX', r.message) : this.socket.error('TX', r.message);
  }

  /**
   * Initialises HTTP Integration object
   * @param {object} httpConfig
   * @private
   */
  _initHTTPClient(httpConfig) {
    this.socket.info('TX', `Initialise HTTP Client on port`);
    this.http = new HTTPIntegration();
    this.http.init(httpConfig);
    this.httpMessages = httpConfig.messages;
  }

  /**
   * Sends time object over websockets
   */
  broadcastTimer() {
    // through websockets
    this.socket.send('timer', this.getTimeObject());
  }

  /**
   * @description Broadcast timer data
   * @private
   */
  _broadcastFeatureTimer() {
    const featureData = {
      clock: this.clock,
      current: this.current,
      secondaryTimer: this.secondaryTimer,
      duration: this.duration,
      startedAt: this._startedAt,
      expectedFinish: this._getExpectedFinish(),
    };
    this.socket.send('ontime-timer', featureData);
  }

  /**
   * @description Broadcast data for Event List feature
   * @private
   */
  _broadcastFeatureRundown() {
    const featureData = {
      selectedEventId: this.selectedEventId,
      nextEventId: this.nextEventId,
      playback: this.state,
    };
    this.socket.send('feat-rundown', featureData);
  }

  /**
   * @description Broadcast data for Playback Control feature
   * @private
   */
  _broadcastFeaturePlaybackControl() {
    const numEvents = EventLoader.getNumEvents();
    const featureData = {
      playback: this.state,
      selectedEventId: this.selectedEventId,
      numEvents: numEvents,
    };
    this.socket.send('feat-playbackcontrol', featureData);
  }

  /**
   * @description Broadcast data for Info feature
   * @private
   */
  _broadcastFeatureInfo() {
    const numEvents = EventLoader.getNumEvents();
    const featureData = {
      titles: this.titles,
      playback: this.state,
      selectedEventId: this.selectedEventId,
      selectedEventIndex: this.selectedEventIndex,
      numEvents: numEvents,
    };
    this.socket.send('feat-info', featureData);
  }

  _broadcastFeatureCuesheet() {
    const numEvents = EventLoader.getNumEvents();
    const featureData = {
      playback: this.state,
      selectedEventId: this.selectedEventId,
      selectedEventIndex: this.selectedEventIndex,
      numEvents: numEvents,
      titleNow: this.titles.titleNow,
    };
    this.socket.send('feat-cuesheet', featureData);
  }

  /**
   * Broadcasts complete object state
   */
  broadcastState() {
    // feature sync
    this._broadcastFeatureRundown();
    this._broadcastFeaturePlaybackControl();
    this._broadcastFeatureInfo();
    this._broadcastFeatureCuesheet();
    this._broadcastFeatureTimer();

    this.broadcastTimer();
    this.socket.send('playstate', this.state);
    this.socket.send('selected-id', this.selectedEventId);
    this.socket.send('next-id', this.nextEventId);
    this.socket.send('publicselected-id', this.selectedPublicEventId);
    this.socket.send('publicnext-id', this.nextPublicEventId);
    this.socket.send('titles', this.titles);
    this.socket.send('publictitles', this.titlesPublic);
  }

  /**
   * @description State machine checks what actions need to
   * happen at every app cycle
   */
  runCycle() {
    const h = this.httpMessages?.messages;
    let httpMessage = null;

    switch (this.ontimeCycle) {
      case 'idle':
        break;
      case 'armed':
        // if we come from roll, see if we can start
        if (this.state === 'roll') {
          this.update();
        }
        break;
      case 'onLoad':
        // check integrations - http
        if (h?.onLoad?.enabled) {
          if (h?.onLoad?.url != null || h?.onLoad?.url !== '') {
            httpMessage = h?.onLoad?.url;
          }
        }

        // update lifecycle: armed
        this.ontimeCycle = this.cycleState.armed;
        break;
      case 'onStart':
        // send OSC if there is something running
        // _finish at is only set when an event is loaded
        if (this._finishAt > 0) {
          this.sendOsc(this.osc.implemented.play);
          this.sendOsc(this.osc.implemented.eventNumber, this.selectedEventIndex || 0);
        }
        // check integrations - http
        if (h?.onLoad?.enabled) {
          if (h?.onLoad?.url != null || h?.onStart?.url !== '') {
            httpMessage = h?.onStart?.url;
          }
        }

        // update lifecycle: onUpdate
        this.ontimeCycle = this.cycleState.onUpdate;
        break;
      case 'onUpdate':
        // call update
        this.update();
        // through OSC, only if running
        if (this.state === 'start' || this.state === 'roll') {
          if (this.current != null && this.secondaryTimer == null) {
            this.sendOsc(this.osc.implemented.time, this.timeTag);
            this.sendOsc(this.osc.implemented.overtime, this.current > 0 ? 0 : 1);
            this.sendOsc(this.osc.implemented.title, this.titles?.titleNow || '');
            this.sendOsc(this.osc.implemented.presenter, this.titles?.presenterNow || '');
          }
        }

        // check integrations - http
        if (h?.onLoad?.enabled) {
          if (h?.onLoad?.url != null || h?.onUpdate?.url !== '') {
            httpMessage = h?.onUpdate?.url;
          }
        }

        break;
      case 'onPause':
        // send OSC
        if (this.prevCycle === this.cycleState.onUpdate) {
          this.sendOsc(this.osc.implemented.pause);
        }

        // check integrations - http
        if (h?.onLoad?.enabled) {
          if (h?.onLoad?.url != null || h?.onPause?.url !== '') {
            httpMessage = h?.onPause?.url;
          }
        }

        // update lifecycle: armed
        this.ontimeCycle = this.cycleState.armed;

        break;
      case 'onStop':
        // send OSC if something was actually stopped
        if (this.prevCycle === this.cycleState.onUpdate) {
          this.sendOsc(this.osc.implemented.stop);
        }

        // check integrations - http
        if (h?.onLoad?.enabled) {
          if (h?.onLoad?.url != null || h?.onStop?.url !== '') {
            httpMessage = h?.onStop?.url;
          }
        }

        // update lifecycle: idle
        this.ontimeCycle = this.cycleState.idle;
        break;
      case 'onFinish':
        // finished an event
        this.sendOsc(this.osc.implemented.finished);

        // check integrations - http
        if (h?.onLoad?.enabled) {
          if (h?.onLoad?.url != null || h?.onFinish?.url !== '') {
            httpMessage = h?.onFinish?.url;
          }
        }

        // update lifecycle: onUpdate
        this.ontimeCycle = this.cycleState.onUpdate;
        break;
      default:
        this.socket.error('SERVER', `Unhandled cycle: ${this.ontimeCycle}`);
    }

    // send http message if any
    if (httpMessage != null) {
      const v = {
        $timer: this.timeTag,
        $title: this.titles.titleNow,
        $presenter: this.titles.presenterNow,
        $subtitle: this.titles.subtitleNow,
        '$next-title': this.titles.titleNext,
        '$next-presenter': this.titles.presenterNext,
        '$next-subtitle': this.titles.subtitleNext,
      };
      const m = cleanURL(replacePlaceholder(httpMessage, v));
      this.http.send(m);
    }

    // update
    this.update();
    this.broadcastState();

    // reset cycle
    this.prevCycle = this.ontimeCycle;
  }

  update() {
    // if there is nothing selected, update clock
    this.clock = Timer.getCurrentTime();
    this._broadcastFeatureTimer();
    this.broadcastTimer();

    // if we are not updating, send the timers
    if (this.ontimeCycle !== this.cycleState.onUpdate) {
      this.socket.send('timer', this.getTimeObject());
    }

    // Have we skipped onStart?
    if (this.state === 'start' || this.state === 'roll') {
      if (this.ontimeCycle === this.cycleState.armed) {
        // update lifecycle: onStart
        this.ontimeCycle = this.cycleState.onStart;
        this.runCycle();
      }
    }

    // update default functions
    super.update();

    if (this._finishedFlag) {
      // update lifecycle: onFinish and call cycle

      this.ontimeCycle = this.cycleState.onFinish;
      this._finishedFlag = false;
      this.runCycle();
    }

    // only implement roll here, rest implemented in super
    if (this.state === 'roll') {
      const u = {
        selectedEventId: this.selectedEventId,
        current: this.current,
        // safeguard on midnight rollover
        _finishAt: this._finishAt >= this._startedAt ? this._finishAt : this._finishAt + DAY_TO_MS,
        clock: this.clock,
        secondaryTimer: this.secondaryTimer,
        _secondaryTarget: this._secondaryTarget,
      };

      const { updatedTimer, updatedSecondaryTimer, doRollLoad, isFinished } = updateRoll(u);

      this.current = updatedTimer;
      this.secondaryTimer = updatedSecondaryTimer;

      if (isFinished) {
        // update lifecycle: onFinish
        this.ontimeCycle = this.cycleState.onFinish;
        this.runCycle();
      }

      if (doRollLoad) {
        this.rollLoad();
      }
    }
  }

  /**
   *
   * @param {string} eventId
   */
  syncLoaded(eventId) {
    if (this.state === 'roll') {
      this.rollLoad();
    } else {
      const event = EventLoader.getEventWithId(eventId);
      this.loadEvent(event, 'reload');
    }
  }

  /**
   * Loads a given event by index
   * @typedef ('load'|'reload') loadEventOptions
   * @param {object} event
   * @param {string} [type='load'] - 'load' or 'reload', whether we are keeping running time
   */
  loadEvent(event, type = 'load') {
    const loadedData = eventLoader.loadById(event.id);
    if (!loadedData) {
      return;
    }

    const { loadedEvent, selectedEventIndex, selectedEventId, nextEventId, titles, titlesPublic } =
      loadedData;

    const start = loadedEvent.timeStart || 0;
    let end = loadedEvent.timeEnd || 0;

    // in case the end is earlier than start, we assume is the day after
    if (end < start) {
      end += DAY_TO_MS;
    }

    this.duration = end - start;
    this.selectedEventIndex = selectedEventIndex;
    this.selectedEventId = selectedEventId;
    this.nextEventId = nextEventId;

    if (type === 'load') {
      this._resetTimers();
      this.current = this.duration;
    } else {
      const now = Timer.getCurrentTime();
      const elapsed = this.getElapsed();
      this._finishAt = now + (this.duration - elapsed);
    }

    this.titles = titles;
    this.titlesPublic = titlesPublic;

    // update lifecycle: onLoad
    this.ontimeCycle = this.cycleState.onLoad;
  }

  /**
   * @description resets selected event data
   * @private
   */
  _resetSelection() {
    this.titles = {
      titleNow: null,
      subtitleNow: null,
      presenterNow: null,
      noteNow: null,
      titleNext: null,
      subtitleNext: null,
      presenterNext: null,
      noteNext: null,
    };

    this.titlesPublic = {
      titleNow: null,
      subtitleNow: null,
      presenterNow: null,
      titleNext: null,
      subtitleNext: null,
      presenterNext: null,
    };

    this.selectedEventIndex = null;
    this.selectedEventId = null;
    this.nextEventId = null;
    this.selectedPublicEventId = null;
    this.nextPublicEventId = null;
  }

  /**
   * @description start timer
   * @return {('start'|'pause'|'stop'|'roll')} Playback state
   */
  start() {
    // do we need to change
    if (this.state === 'start') return 'start';

    // call super
    super.start();

    // update lifecycle: onStart
    this.ontimeCycle = this.cycleState.onStart;

    return this.state;
  }

  /**
   * @description pause timer
   * @return {('start'|'pause'|'stop')} Playback state
   */
  pause() {
    // do we need to change
    if (this.state === 'pause') return 'pause';

    // call super
    super.pause();

    // update lifecycle: onPause
    this.ontimeCycle = this.cycleState.onPause;

    return this.state;
  }

  /**
   * @description stop timer
   * @return {('start'|'pause'|'stop'|'roll')} Playback state
   */
  stop() {
    // do we need to change
    if (this.state === 'stop') return 'stop';

    // call super
    super.stop();
    this._resetTimers(true);
    this._resetSelection();

    // update lifecycle: onStop
    this.ontimeCycle = this.cycleState.onStop;

    // broadcast state
    this.broadcastState();

    return this.state;
  }

  /**
   * @description increment timer by amount
   * @param amount
   */
  increment(amount) {
    // call super
    super.increment(amount);

    // run cycle
    this.runCycle();
  }

  /**
   * @description Look for current event considering local clock
   */
  rollLoad() {
    const prevLoaded = this.selectedEventId;

    // maybe roll has already been loaded
    if (this.secondaryTimer === null) {
      this._resetTimers(true);
      this._resetSelection();
    }

    const { nowIndex, nowId, publicIndex, nextIndex, publicNextIndex, timers, timeToNext } =
      eventLoader.findRoll();

    // nothing to play, unload
    if (nowIndex === null && nextIndex === null) {
      this.stop();
      this.socket.warning('SERVER', 'Roll: no events found');
      return;
    }

    // there is something running, load
    if (nowIndex !== null) {
      // clear secondary timers
      this.secondaryTimer = null;
      this._secondaryTarget = null;

      // set timers
      this._startedAt = timers._startedAt;
      this._finishAt = timers._finishAt;
      this.duration = timers.duration;
      this.current = timers.current;

      // set selection
      this.selectedEventId = nowId;
      this.selectedEventIndex = nowIndex;
    }

    // found something to run next
    if (nextIndex != null) {
      const eventNext = EventLoader.getPlayableAtIndex(nextIndex);

      // Set running timers
      if (nowIndex === null) {
        // only warn the first time
        if (this.secondaryTimer === null) {
          this.socket.info('SERVER', 'Roll: waiting for event start');
        }

        // reset running timer
        // ??? should this not have been reset?
        this.current = null;

        // timer counts to next event
        this.secondaryTimer = timeToNext;
        this._secondaryTarget = eventNext.timeStart;
      }

      // TITLES: Load next private
      // Todo: this should be an ID
      // todo: this logic should be removed
      if (eventNext) {
        this.titles.titleNext = eventNext.title;
        this.titles.subtitleNext = eventNext.subtitle;
        this.titles.presenterNext = eventNext.presenter;
        this.titles.noteNext = eventNext.note;
        this.nextEventId = eventNext.id;
      }
    }

    // Todo: this should be an ID
    // todo: this logic should be removed
    // TITLES: Load next public
    if (publicNextIndex !== null) {
      const eventNextPublic = EventLoader.getPlayableAtIndex(publicNextIndex);
      if (eventNextPublic) {
        this.titlesPublic.titleNext = eventNextPublic.title;
        this.titlesPublic.subtitleNext = eventNextPublic.subtitle;
        this.titlesPublic.presenterNext = eventNextPublic.presenter;
        this.titlesPublic.noteNext = eventNextPublic.note;
        this.nextPublicEventId = eventNextPublic.id;
      }
    }

    // Todo: this should be an ID
    // todo: this logic should be removed
    // TITLES: Load now private
    if (nowIndex !== null) {
      const eventNowPrivate = EventLoader.getPlayableAtIndex(nowIndex);
      if (eventNowPrivate) {
        this.titles.titleNow = eventNowPrivate.title;
        this.titles.subtitleNow = eventNowPrivate.subtitle;
        this.titles.presenterNow = eventNowPrivate.presenter;
        this.titles.noteNow = eventNowPrivate.note;
        this.selectedEventId = eventNowPrivate.id;
      }
    }

    // Todo: this should be an ID
    // todo: this logic should be removed
    // TITLES: Load now public
    if (publicIndex !== null) {
      const eventNowPublic = EventLoader.getPlayableAtIndex(nowIndex);
      if (eventNowPublic) {
        this.titlesPublic.titleNow = eventNowPublic.title;
        this.titlesPublic.subtitleNow = eventNowPublic.subtitle;
        this.titlesPublic.presenterNow = eventNowPublic.presenter;
        this.titlesPublic.noteNow = eventNowPublic.note;
        this.selectedPublicEventId = eventNowPublic.id;
      }
    }

    if (prevLoaded !== this.selectedEventId) {
      // update lifecycle: onLoad
      this.ontimeCycle = this.cycleState.onLoad;
      // ensure we go through onLoad cycle
      this.runCycle();
    }
  }

  /**
   * Starts roll mode
   * @return {('start'|'pause'|'stop'|'roll')} Playback state
   */
  roll() {
    if (this.state === 'roll') {
      return 'roll';
    }

    this.state = 'roll';

    // update lifecycle: armed
    this.ontimeCycle = this.cycleState.armed;

    // load into event
    this.rollLoad();

    return this.state;
  }

  previous() {
    this.sendOsc(this.osc.implemented.previous);
    this.pause();
    this.runCycle();
  }

  next() {
    this.sendOsc(this.osc.implemented.next);
    this.pause();
    this.runCycle();
  }

  /**
   * @description reloads current event
   * @return {('start'|'pause'|'stop'|'roll')} Playback state
   */
  reload() {
    if (!this.selectedEventId) {
      return this.state;
    }

    // change playstate
    this.pause();

    // send OSC
    this.sendOsc(this.osc.implemented.reload);

    // reload data
    const event = EventLoader.getEventWithId(this.selectedEventId);
    this.loadEvent(event);

    this.runCycle();

    return this.state;
  }

  /****************************************************************************/

  /**
   * Integrations
   * -------------
   *
   * Code related to integrations
   *
   */

  /**
   * Calls OSC send message and resolves reply to logger
   * @param {string} message
   * @param {any} [payload]
   */
  async sendOsc(message, payload) {
    const reply = await this.osc.send(message, payload);
    if (!reply.success) {
      this.socket.error('TX', reply.message);
    }
  }

  /**
   * @description Builds sync object
   */
  poll() {
    return {
      currentId: this.selectedEventId,
      timer: this.timeTag,
      clock: this.clock,
      playback: this.state,
      currentColour: null,
      title: this.titles.titleNow,
      presenter: this.titles.presenterNow,
    };
  }
}
