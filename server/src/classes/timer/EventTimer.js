import { Timer } from './Timer.js';
import { DAY_TO_MS, getSelectionByRoll, replacePlaceholder, updateRoll } from './classUtils.js';
import { OSCIntegration } from './integrations/Osc.js';
import { HTTPIntegration } from './integrations/Http.js';
import { cleanURL } from '../../utils/url.js';

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

    this.rundown = [];

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
      expectedFinish: this._getExpectedFinish(),
      startedAt: this._startedAt,
    };
    this.socket.send('ontime-timer', featureData);
  }

  /**
   * @description Broadcast data for Event List feature
   * @private
   */
  _broadcastFeatureEventList() {
    const featureData = {
      selectedEventId: this.selectedEventId,
      nextEventId: this.nextEventId,
      playback: this.state,
    };
    this.socket.send('ontime-feat-eventlist', featureData);
  }

  /**
   * @description Broadcast data for Playback Control feature
   * @private
   */
  _broadcastFeaturePlaybackControl() {
    const featureData = {
      playback: this.state,
      selectedEventId: this.selectedEventId,
      numEvents: this.rundown.length,
    };
    this.socket.send('ontime-feat-playbackcontrol', featureData);
  }

  /**
   * @description Broadcast data for Info feature
   * @private
   */
  _broadcastFeatureInfo() {
    const featureData = {
      titles: this.titles,
      playback: this.state,
      selectedEventId: this.selectedEventId,
      selectedEventIndex: this.selectedEventIndex,
      numEvents: this.rundown.length,
    };
    this.socket.send('ontime-feat-info', featureData);
  }

  _broadcastFeatureCuesheet() {
    const featureData = {
      playback: this.state,
      selectedEventId: this.selectedEventId,
      selectedEventIndex: this.selectedEventIndex,
      numEvents: this.rundown.length,
      titleNow: this.titles.titleNow,
    };
    this.socket.send('ontime-feat-cuesheet', featureData);
  }

  /**
   * Broadcasts complete object state
   */
  broadcastState() {
    // feature sync
    this._broadcastFeatureEventList();
    this._broadcastFeaturePlaybackControl();
    this._broadcastFeatureInfo();
    this._broadcastFeatureCuesheet();
    this._broadcastFeatureTimer();

    const numEvents = this.rundown.length;
    this.broadcastTimer();
    this.socket.send('playstate', this.state);
    this.socket.send('selected', {
      id: this.selectedEventId,
      index: this.selectedEventIndex,
      total: numEvents,
    });
    this.socket.send('selected-id', this.selectedEventId);
    this.socket.send('next-id', this.nextEventId);
    this.socket.send('numevents', numEvents);
    this.socket.send('publicselected-id', this.selectedPublicEventId);
    this.socket.send('publicnext-id', this.nextPublicEventId);
    this.socket.send('titles', this.titles);
    this.socket.send('publictitles', this.titlesPublic);
  }

  /**
   * @description Interface for triggering playback actions
   * @param {string} action - state to be triggered
   * @param {string|number} [payload] - optional action payload
   * @returns {boolean} Whether action was called
   */
  trigger(action, payload) {
    let success = true;
    const numEvents = this.rundown.length;
    switch (action) {
      case 'start': {
        if (!numEvents) return false;
        // Call action and force update
        this.socket.info('PLAYBACK', 'Play Mode Start');
        this.start();
        break;
      }
      case 'startById': {
        if (!numEvents) return false;
        const loaded = this.loadEventById(payload);
        if (loaded) {
          this.socket.info('PLAYBACK', `Loaded event with ID ${payload}`);
          this.socket.info('PLAYBACK', 'Play Mode Start');
          this.start();
        } else {
          return false;
        }
        break;
      }
      case 'startByIndex': {
        if (!numEvents) return false;
        const loaded = this.loadEventByIndex(payload);
        if (loaded) {
          this.socket.info('PLAYBACK', `Loaded event with index ${payload}`);
          this.socket.info('PLAYBACK', 'Play Mode Start');
          this.start();
        } else {
          return false;
        }
        break;
      }
      case 'pause': {
        if (!numEvents) return false;
        // Call action and force update
        this.socket.info('PLAYBACK', 'Play Mode Pause');
        this.pause();
        break;
      }
      case 'stop': {
        if (!numEvents) return false;
        // Call action and force update
        this.socket.info('PLAYBACK', 'Play Mode Stop');
        this.stop();
        break;
      }
      case 'roll': {
        if (!numEvents) return false;
        // Call action and force update
        this.socket.info('PLAYBACK', 'Play Mode Roll');
        this.roll();
        break;
      }
      case 'previous': {
        if (!numEvents) return false;
        // Call action and force update
        this.socket.info('PLAYBACK', 'Play Mode Previous');
        this.previous();
        break;
      }
      case 'next': {
        if (!numEvents) return false;
        // Call action and force update
        this.socket.info('PLAYBACK', 'Play Mode Next');
        this.next();
        break;
      }
      case 'loadById': {
        if (!numEvents) return false;
        const loaded = this.loadEventById(payload);
        if (loaded) {
          this.socket.info('PLAYBACK', `Loaded event with ID ${payload}`);
        } else {
          return false;
        }
        break;
      }
      case 'loadByIndex': {
        if (!numEvents) return false;
        const loaded = this.loadEventByIndex(payload);
        if (loaded) {
          this.socket.info('PLAYBACK', `Loaded event with index ${payload}`);
        } else {
          return false;
        }
        break;
      }
      case 'unload': {
        if (!numEvents) return false;
        // Call action and force update
        this.socket.info('PLAYBACK', 'Events unloaded');
        this.unload();
        break;
      }
      case 'reload': {
        if (!numEvents) return false;
        // Call action and force update
        this.socket.info('PLAYBACK', 'Reloaded event');
        this.reload();
        break;
      }
      default: {
        // Error, disable flag
        this.socket.error('RX', `Unhandled action triggered ${action}`);
        success = false;
        break;
      }
    }

    // update state
    this.runCycle();
    return success;
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
   * Deletes running event list from object
   */
  clearEventList() {
    // unload events
    this.unload();

    // set general
    this.rundown = [];

    // update lifecycle: onStop
    this.ontimeCycle = this.cycleState.onStop;

    // update clients
    this.socket.send('numevents', this.rundown.length);
  }

  /**
   * Adds an event list to object
   * @param {array} eventlist
   */
  setupWithEventList(eventlist) {
    if (!Array.isArray(eventlist) || !eventlist.length) return;

    // filter only events
    const events = eventlist.filter((e) => e.type === 'event');
    const numEvents = events.length;

    // set general
    this.rundown = events;

    // list may contain no events
    if (numEvents < 1) return;

    // load first event
    this.loadEvent(0);

    // update clients
    this.broadcastState();

    // run cycle
    this.runCycle();
  }

  /**
   * Updates event list in object
   * @param {array} eventlist
   */
  updateEventList(eventlist) {
    if (!Array.isArray(eventlist) || !eventlist.length) return;

    // filter only events
    const events = eventlist.filter((e) => e.type === 'event' && !e.skip);
    const numEvents = events.length;

    // set general
    this.rundown = events;

    // list may be empty
    if (numEvents < 1) {
      this.unload();
      return;
    }

    // auto load if is the there was nothing before
    if (!this.rundown.length) {
      this.loadEvent(0);
    } else if (this.selectedEventId != null) {
      // handle reload selected
      // Look for event (order might have changed)
      const eventIndex = this.rundown.findIndex((e) => e.id === this.selectedEventId);

      // Maybe is missing
      if (eventIndex === -1) {
        this._resetTimers();
        this._resetSelection();
        return;
      }

      // Reload data if running
      const type = this._startedAt != null ? 'reload' : 'load';
      this.loadEvent(eventIndex, type);
    }

    // update clients
    this.broadcastState();

    // run cycle
    this.runCycle();
  }

  /**
   * Updates a single id in the object list
   * @param {string} id
   * @param {object} entry - new event object
   */
  updateSingleEvent(id, entry) {
    // find object in events
    const eventIndex = this.rundown.findIndex((e) => e.id === id);
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }

    // check if event is set to be skipped
    if (entry.skip) {
      // stop event if running
      if (id === this.selectedEventId) {
        this.trigger('stop');
      }

      // delete event
      this.deleteId(id);
    }

    // update event in memory
    const e = this.rundown[eventIndex];
    this.rundown[eventIndex] = { ...e, ...entry };

    try {
      // check if entry is running
      if (e.id === this.selectedEventId) {
        // handle reload selected
        // Reload data if running
        const type = this.selectedEventId === id && this._startedAt != null ? 'reload' : 'load';
        this.loadEvent(this.selectedEventIndex, type);
      } else if (e.id === this.nextEventId) {
        // roll needs to recalculate
        if (this.state === 'roll') {
          this.rollLoad();
        }
      }

      // load titles
      if ('title' in e || 'subtitle' in e || 'presenter' in e) {
        this._loadTitlesNext();
        this._loadTitlesNow();
      }
    } catch (error) {
      this.socket.error('SERVER', error);
    }

    // update clients
    this.broadcastState();

    // run cycle
    this.runCycle();
  }

  /**
   * @description inserts an event after a given id
   * @param event
   * @param previousId
   */
  insertEventAfterId(event, previousId) {
    if (typeof previousId === 'undefined') {
      // Insert at beginning
      this.rundown.unshift(event);
    } else {
      // find object in events
      const previousIndex = this.rundown.findIndex((e) => e.id === previousId);
      if (previousIndex === -1) {
        throw 'Event not found';
      }

      if (previousIndex + 1 >= this.rundown.length) {
        this.rundown.push(event);
      } else {
        this.rundown.splice(previousIndex + 1, 0, event);
      }

      try {
        // check if entry is running
        if (event.id === this.selectedEventId) {
          // handle reload selected
          // Reload data if running
          const type =
            this.selectedEventId === event.id && this._startedAt != null ? 'reload' : 'load';
          this.loadEvent(this.selectedEventIndex, type);
        } else if (event.id === this.nextEventId) {
          // roll needs to recalculate
          if (this.state === 'roll') {
            this.rollLoad();
          }
        }

        // load titles
        if ('title' in event || 'subtitle' in event || 'presenter' in event) {
          this._loadTitlesNext();
          this._loadTitlesNow();
        }
      } catch (error) {
        this.socket.error('SERVER', error);
      }
    }

    // update clients
    this.broadcastState();

    // run cycle
    this.runCycle();
  }

  /**
   * Deleted an event from the list by its id
   * @param {string} eventId
   */
  deleteId(eventId) {
    // find object in events
    const eventIndex = this.rundown.findIndex((e) => e.id === eventId);
    if (eventIndex === -1) return;

    // delete event and update count
    this.rundown.splice(eventIndex, 1);

    // reload data if necessary
    if (eventId === this.selectedEventId) {
      this.unload();
      return;
    }

    // update selected event index
    this.selectedEventIndex = this.rundown.findIndex((e) => e.id === this.selectedEventId);

    // reload titles if necessary
    if (eventId === this.nextEventId || eventId === this.nextPublicEventId) {
      this._loadTitlesNext();
    } else if (eventId === this.selectedPublicEventId) {
      this._loadTitlesNow();
    }

    // update clients
    this.broadcastState();

    // run cycle
    this.runCycle();
  }

  /**
   * @description loads an event with a given Id
   * @param {string} eventId - ID of event in eventlist
   */
  loadEventById(eventId) {
    const eventIndex = this.rundown.findIndex((e) => e.id === eventId);

    if (eventIndex === -1) return false;
    this.pause();
    this.loadEvent(eventIndex, 'load');
    // run cycle
    this.runCycle();
    return true;
  }

  /**
   * @description loads an event with a given index
   * @param {number} eventIndex - Index of event in eventlist
   */
  loadEventByIndex(eventIndex) {
    if (eventIndex === -1 || eventIndex > this.rundown.length) return false;
    this.pause();
    this.loadEvent(eventIndex, 'load');
    // run cycle
    this.runCycle();
    return true;
  }

  /**
   * Loads a given event by index
   * @param {object} eventIndex
   * @param {string} [type='load'] - 'load' or 'reload', whether we are keeping running time
   */
  loadEvent(eventIndex, type = 'load') {
    const e = this.rundown?.[eventIndex];
    if (e == null) return;

    const start = e.timeStart == null || e.timeStart === '' ? 0 : e.timeStart;
    let end = e.timeEnd == null || e.timeEnd === '' ? 0 : e.timeEnd;
    // in case the end is earlier than start, we assume is the day after
    if (end < start) end += DAY_TO_MS;

    // time stuff changes on whether we keep the running clock
    if (type === 'load') {
      this._resetTimers();

      this.duration = end - start;
      this.current = this.duration;
      this.selectedEventIndex = eventIndex;
      this.selectedEventId = e.id;
    } else if (type === 'reload') {
      const now = Timer.getCurrentTime();
      const elapsed = this.getElapsed();

      this.duration = end - start;
      this.selectedEventIndex = eventIndex;
      this._finishAt = now + (this.duration - elapsed);
    }

    // load current titles
    this._loadTitlesNow();

    // look for event after
    this._loadTitlesNext();

    // update lifecycle: onLoad
    this.ontimeCycle = this.cycleState.onLoad;
  }

  /**
   * @description loads given title (now)
   * @private
   */
  _loadTitlesNow() {
    const e = this.rundown[this.selectedEventIndex];
    if (e == null) return;

    // private title is always current
    // check if current is also public
    if (e.isPublic) {
      this._loadThisTitles(e, 'now');
    } else {
      this._loadThisTitles(e, 'now-private');

      // assume there is no public event
      this.titlesPublic.titleNow = null;
      this.titlesPublic.subtitleNow = null;
      this.titlesPublic.presenterNow = null;
      this.selectedPublicEventId = null;

      // if there is nothing before, return
      if (this.selectedEventIndex === 0) return;

      // iterate backwards to find it
      for (let i = this.selectedEventIndex; i >= 0; i--) {
        if (this.rundown[i].type === 'event' && this.rundown[i].isPublic) {
          this._loadThisTitles(this.rundown[i], 'now-public');
          break;
        }
      }
    }
  }

  /**
   * @description loads given title
   * @param e
   * @param type
   * @private
   */
  _loadThisTitles(e, type) {
    if (e == null) return;

    switch (type) {
      // now, load to both public and private
      case 'now':
        // public
        this.titlesPublic.titleNow = e.title;
        this.titlesPublic.subtitleNow = e.subtitle;
        this.titlesPublic.presenterNow = e.presenter;
        this.selectedPublicEventId = e.id;

        // private
        this.titles.titleNow = e.title;
        this.titles.subtitleNow = e.subtitle;
        this.titles.presenterNow = e.presenter;
        this.titles.noteNow = e.note;
        this.selectedEventId = e.id;

        break;
      case 'now-public':
        this.titlesPublic.titleNow = e.title;
        this.titlesPublic.subtitleNow = e.subtitle;
        this.titlesPublic.presenterNow = e.presenter;
        this.selectedPublicEventId = e.id;
        break;
      case 'now-private':
        this.titles.titleNow = e.title;
        this.titles.subtitleNow = e.subtitle;
        this.titles.presenterNow = e.presenter;
        this.titles.noteNow = e.note;
        this.selectedEventId = e.id;
        break;

      // next, load to both public and private
      case 'next':
        // public
        this.titlesPublic.titleNext = e.title;
        this.titlesPublic.subtitleNext = e.subtitle;
        this.titlesPublic.presenterNext = e.presenter;
        this.nextPublicEventId = e.id;

        // private
        this.titles.titleNext = e.title;
        this.titles.subtitleNext = e.subtitle;
        this.titles.presenterNext = e.presenter;
        this.titles.noteNext = e.note;
        this.nextEventId = e.id;
        break;
      case 'next-public':
        this.titlesPublic.titleNext = e.title;
        this.titlesPublic.subtitleNext = e.subtitle;
        this.titlesPublic.presenterNext = e.presenter;
        this.nextPublicEventId = e.id;
        break;
      case 'next-private':
        this.titles.titleNext = e.title;
        this.titles.subtitleNext = e.subtitle;
        this.titles.presenterNext = e.presenter;
        this.titles.noteNext = e.note;
        this.nextEventId = e.id;
        break;

      default:
        break;
    }
  }

  /**
   * @description look for next titles to load
   * @private
   */
  _loadTitlesNext() {
    // maybe there is nothing to load
    if (this.selectedEventIndex == null) return;

    // assume there is no next event
    this.titles.titleNext = null;
    this.titles.subtitleNext = null;
    this.titles.presenterNext = null;
    this.titles.noteNext = null;
    this.nextEventId = null;

    this.titlesPublic.titleNext = null;
    this.titlesPublic.subtitleNext = null;
    this.titlesPublic.presenterNext = null;
    this.nextPublicEventId = null;

    const numEvents = this.rundown.length;

    if (this.selectedEventIndex < numEvents - 1) {
      let nextPublic = false;
      let nextPrivate = false;

      for (let i = this.selectedEventIndex + 1; i < numEvents; i++) {
        // check that is the right type
        if (this.rundown[i].type === 'event') {
          // if we have not set private
          if (!nextPrivate) {
            this._loadThisTitles(this.rundown[i], 'next-private');
            nextPrivate = true;
          }

          // if event is public
          if (this.rundown[i].isPublic) {
            this._loadThisTitles(this.rundown[i], 'next-public');
            nextPublic = true;
          }
        }

        // Stop if both are set
        if (nextPublic && nextPrivate) break;
      }
    }
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
   */
  start() {
    // do we need to change
    if (this.state === 'start') return;

    // if there is nothing selected, no nothing
    if (this.selectedEventId == null) return;

    // call super
    super.start();

    // update lifecycle: onStart
    this.ontimeCycle = this.cycleState.onStart;
  }

  /**
   * @description pause timer
   */
  pause() {
    // do we need to change
    if (this.state === 'pause') return;

    // if there is nothing selected, no nothing
    if (this.selectedEventId == null) return;

    // call super
    super.pause();

    // update lifecycle: onPause
    this.ontimeCycle = this.cycleState.onPause;
  }

  /**
   * @description stop timer
   */
  stop() {
    // do we need to change
    if (this.state === 'stop') return;

    // call super
    super.stop();
    this._resetSelection();

    // update lifecycle: onPause
    this.ontimeCycle = this.cycleState.onStop;
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
    const now = Timer.getCurrentTime();
    const prevLoaded = this.selectedEventId;

    // maybe roll has already been loaded
    if (this.secondaryTimer === null) {
      this._resetTimers(true);
      this._resetSelection();
    }

    const { nowIndex, nowId, publicIndex, nextIndex, publicNextIndex, timers, timeToNext } =
      getSelectionByRoll(this.rundown, now);

    // nothing to play, unload
    if (nowIndex === null && nextIndex === null) {
      this.unload();
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
        this._secondaryTarget = this.rundown[nextIndex].timeStart;
      }

      // TITLES: Load next private
      this._loadThisTitles(this.rundown[nextIndex], 'next-private');
    }

    // TITLES: Load next public
    if (publicNextIndex !== null) {
      this._loadThisTitles(this.rundown[publicNextIndex], 'next-public');
    }

    // TITLES: Load now private
    if (nowIndex !== null) {
      this._loadThisTitles(this.rundown[nowIndex], 'now-private');
    }
    // TITLES: Load now public
    if (publicIndex !== null) {
      this._loadThisTitles(this.rundown[publicIndex], 'now-public');
    }

    if (prevLoaded !== this.selectedEventId) {
      // update lifecycle: onLoad
      this.ontimeCycle = this.cycleState.onLoad;
      // ensure we go through onLoad cycle
      this.runCycle();
    }
  }

  roll() {
    // do we need to change
    if (this.state === 'roll') return;

    if (!this.rundown.length) return;

    // set state
    this.state = 'roll';

    // update lifecycle: armed
    this.ontimeCycle = this.cycleState.armed;

    // load into event
    this.rollLoad();
  }

  previous() {
    // check that we have events to run
    if (!this.rundown.length) return;

    // maybe this is the first event?
    if (this.selectedEventIndex === 0) return;

    // if there is no event running, go to first
    if (!this.selectedEventIndex) {
      this.loadEvent(0);
    } else {
      const gotoEvent = this.selectedEventIndex > 0 ? this.selectedEventIndex - 1 : 0;
      if (gotoEvent === this.selectedEventIndex) return;
      this.loadEvent(gotoEvent);
    }

    // send OSC
    this.sendOsc(this.osc.implemented.previous);

    // change playstate
    this.pause();
  }

  next() {
    const numEvents = this.rundown.length;
    // check that we have events to run
    if (!numEvents) return;

    // maybe this is the last event?
    if (this.selectedEventIndex === numEvents - 1) return;

    // if there is no event running, go to first
    if (this.selectedEventIndex === null) {
      this.loadEvent(0);
    } else {
      const gotoEvent =
        this.selectedEventIndex < numEvents - 1 ? this.selectedEventIndex + 1 : numEvents - 1;
      if (gotoEvent === this.selectedEventIndex) return;
      this.loadEvent(gotoEvent);
    }

    // send OSC
    this.sendOsc(this.osc.implemented.next);

    // change playstate
    this.pause();
  }

  unload() {
    // reset timer
    this._resetTimers(true);

    // reset selected
    this._resetSelection();

    // broadcast state
    this.broadcastState();

    // reset playstate
    this.stop();
  }

  /**
   * @description reloads current event
   */
  reload() {
    if (!this.rundown.length) return;

    // change playstate
    this.pause();

    // send OSC
    this.sendOsc(this.osc.implemented.reload);

    // reload data
    this.loadEvent(this.selectedEventIndex);
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
