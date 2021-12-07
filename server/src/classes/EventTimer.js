import {Timer} from './Timer.js';
import {Server} from 'socket.io';
import {DAY_TO_MS, getSelectionByRoll, replacePlaceholder} from './classUtils.js';
import {OSCIntegration} from './integrations/Osc.js';
import {HTTPIntegration} from "./integrations/Http.js";
import {cleanURL} from "../utils/url";

/*
 * EventTimer adds functions specific to APP
 * namely:
 * - Presenter message, text and status
 * - Public message, text and status
 *
 */

export class EventTimer extends Timer {

  // Keep track of Timer lifecycle
  // idle: before it is initialised
  // load: when a new event is loaded
  // update: every update call cycle (1 x second)
  // stop: when the timer is stopped
  // finish: when a timer finishes
  cycleState = {
    idle: 'idle',
    onLoad: 'onLoad',
    armed: 'armed',
    onStart: 'onStart',
    onUpdate: 'onUpdate',
    onPause: 'onPause',
    onStop: 'onStop',
    onFinish: 'onFinish',
  };
  ontimeCycle = 'idle';
  prevCycle = null;
  lastUpdate = null;

  // Socket IO Object
  io = null;

  // OSC Object
  osc = null;

  _numClients = 0;
  _interval = null;

  presenter = {
    text: '',
    visible: false,
  };
  public = {
    text: '',
    visible: false,
  };
  lower = {
    text: '',
    visible: false,
  };

  titlesPublic = {
    titleNow: null,
    subtitleNow: null,
    presenterNow: null,
    titleNext: null,
    subtitleNext: null,
    presenterNext: null,
  };

  titles = {
    titleNow: null,
    subtitleNow: null,
    presenterNow: null,
    noteNow: null,
    titleNext: null,
    subtitleNext: null,
    presenterNext: null,
    noteNext: null,
  };

  selectedEventIndex = null;
  selectedEventId = null;
  nextEventId = null;
  selectedPublicEventId = null;
  nextPublicEventId = null;
  numEvents = null;
  _eventlist = null;

  constructor(httpServer, timerConfig, oscConfig, httpConfig) {

    // call super constructor
    super();

    // initialise socketIO server
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
      },
    });

    console.log('initialise OSC Client on port: ', oscConfig.port);

    // initialise osc object
    this.osc = new OSCIntegration();
    this.osc.init(oscConfig);

    // initialise http object
    this.http = new HTTPIntegration();
    this.http.init(httpConfig);
    this.httpMessages = httpConfig.messages;

    // set recurrent emits
    this._interval = setInterval(
      () => this.runCycle(),
      timerConfig?.refresh || 1000
    );

    // listen to new connections
    this._listenToConnections();
  }

  /**
   * @description Shutdown process
   */
  shutdown() {
    console.log('Shutting down integrations')
    console.log('... Closing socket server');
    this.io.close();
    console.log('... Closing osc server');
    this.osc.shutdown();
  }

  // send current timer
  broadcastTimer() {
    // through websockets
    this.io.emit('timer', this.getObject());
  }

  // broadcast state
  broadcastState() {
    this.io.emit('timer', this.getObject());
    this.io.emit('playstate', this.state);
    this.io.emit('selected', {
      id: this.selectedEventId,
      index: this.selectedEventIndex,
      total: this.numEvents,
    });
    this.io.emit('selected-id', this.selectedEventId);
    this.io.emit('next-id', this.nextEventId);
    this.io.emit('publicselected-id', this.selectedPublicEventId);
    this.io.emit('publicnext-id', this.nextPublicEventId);
    this.io.emit('titles', this.titles);
    this.io.emit('publictitles', this.titlesPublic);
  }

  // broadcast message
  broadcastThis(address, payload) {
    this.io.emit(address, payload);
  }

  /**
   * @description Interface for triggering playback actions
   * @param {string} action - state to be triggered
   * @returns {boolean} Whether action was called
   */
  trigger(action) {
    let reply = true;
    switch (action) {
      case 'start':
        // Call action and force update
        this.start();
        this.runCycle();
        break;
      case 'pause':
        // Call action and force update
        this.pause();
        this.runCycle();
        break;
      case 'stop':
        // Call action and force update
        this.stop();
        this.runCycle();
        break;
      case 'roll':
        // Call action and force update
        this.roll();
        this.runCycle();
        break;
      case 'previous':
        // Call action and force update
        this.previous();
        this.runCycle();
        break;
      case 'next':
        // Call action and force update
        this.next();
        this.runCycle();
        break;
      case 'unload':
        // Call action and force update
        this.unload();
        this.runCycle();
        break;
      case 'reload':
        // Call action and force update
        this.reload();
        this.runCycle();
        break;
      default:
        // Error, disable flag
        console.log('ERROR: Unhandled action triggered')
        reply = false;
        break;
    }
    return reply;
  }


  /**
   * @description State machine checks what actions need to
   * happen at every app cycle
   */
  runCycle() {
    const h = this.httpMessages?.messages;
    let httpMessage = null;

    switch (this.ontimeCycle) {
      case "idle":
        break;
      case "armed":
        // if we come from roll, see if we can start
        if (this.state === 'roll') {
          this.update();
        }
        break;
      case "onLoad":
        // broadcast change
        this.broadcastState();

        // check integrations - http
        if (h?.onLoad?.enabled) {
          if (h?.onLoad?.url != null || h?.onLoad?.url !== '') {
            httpMessage = h?.onLoad?.url;
          }
        }

        // update lifecycle: armed
        this.ontimeCycle = this.cycleState.armed;
        break;
      case "onStart":
        // broadcast current state
        this.broadcastState();
        // send OSC
        this.osc.send(this.osc.implemented.play);

        // check integrations - http
        if (h?.onLoad?.enabled) {
          if (h?.onLoad?.url != null || h?.onStart?.url !== '') {
            httpMessage = h?.onStart?.url;
          }
        }

        // update lifecycle: onUpdate
        this.ontimeCycle = this.cycleState.onUpdate;
        break;
      case "onUpdate":
        // call update
        this.update();
        // broadcast current state
        this.broadcastTimer();
        // through OSC, only if running
        if (this.state === 'start' || this.state === 'roll') {
          this.osc.send(this.osc.implemented.time, this.timeTag);
          this.osc.send(this.osc.implemented.overtime, this.current > 0 ? 0 : 1);
          this.osc.send(this.osc.implemented.title, this.titles?.titleNow || '');
        }

        // check integrations - http
        if (h?.onLoad?.enabled) {
          if (h?.onLoad?.url != null || h?.onUpdate?.url !== '') {
            httpMessage = h?.onUpdate?.url;
          }
        }

        break;
      case "onPause":
        // broadcast current state
        this.broadcastState();
        // send OSC
        this.osc.send(this.osc.implemented.pause);

        // check integrations - http
        if (h?.onLoad?.enabled) {
          if (h?.onLoad?.url != null || h?.onPause?.url !== '') {
            httpMessage = h?.onPause?.url;
          }
        }

        // update lifecycle: armed
        this.ontimeCycle = this.cycleState.armed;

        break;
      case "onStop":
        // broadcast change
        this.broadcastState();
        // send OSC
        this.osc.send(this.osc.implemented.stop);

        // check integrations - http
        if (h?.onLoad?.enabled) {
          if (h?.onLoad?.url != null || h?.onStop?.url !== '') {
            httpMessage = h?.onStop?.url;
          }
        }

        // update lifecycle: idle
        this.ontimeCycle = this.cycleState.idle;
        break;
      case "onFinish":
        // broadcast change
        this.broadcastState();
        // finished an event
        this.osc.send(this.osc.implemented.finished);

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
        console.log(`ERROR: Unhandled cycle: ${this.ontimeCycle}`)
    }

    // send http message if any
    if (httpMessage != null) {
      const v = {
        '$timer': this.timeTag,
        '$title': this.titles.titleNow,
        '$presenter': this.titles.presenterNow,
        '$subtitle': this.titles.subtitleNow,
        '$next-title': this.titles.titleNext,
        '$next-presenter': this.titles.presenterNext,
        '$next-subtitle': this.titles.subtitleNext,
      }
      const m = cleanURL(replacePlaceholder(httpMessage, v));
      this.http.send(m)
    }

    // reset cycle
    this.prevCycle = this.ontimeCycle;
  }

  update() {

    // if there is nothing selected, do nothing
    if (this.selectedEventId == null) return;

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
      // update timer as usual
      if (this.selectedEventId && this.current > 0) {
        // something is running, update
        this.current = this._finishAt - this.clock;

      } else if (this.secondaryTimer > 0) {
        // waiting to start, update secondary
        this.secondaryTimer = this._secondaryTarget - this.clock;
      }

      // look for event if none is loaded
      const currentRunning = this.current <= 0 && this.current !== null;
      const secondaryRunning =
        this.secondaryTimer <= 0 && this.secondaryTimer !== null;

      if (currentRunning) {
        // update lifecycle: onFinish
        this.ontimeCycle = this.cycleState.onFinish;
        this.runCycle();
      }

      if (currentRunning || secondaryRunning) {
        // look for events
        this.rollLoad();
      }
    }
  }

  _setterManager(action, payload) {
    switch (action) {
      /*******************************************/
      // Presenter message
      case 'set-presenter-text':
        this.presenter.text = payload;
        this.broadcastThis('messages-presenter', this.presenter);
        break;
      case 'set-presenter-visible':
        this.presenter.visible = payload;
        this.broadcastThis('messages-presenter', this.presenter);
        break;

      /*******************************************/
      // Public message
      case 'set-public-text':
        this.public.text = payload;
        this.broadcastThis('messages-public', this.public);
        break;
      case 'set-public-visible':
        this.public.visible = payload;
        this.broadcastThis('messages-public', this.public);
        break;

      /*******************************************/
      // Lower third message
      case 'set-lower-text':
        this.lower.text = payload;
        this.broadcastThis('messages-lower', this.lower);
        break;
      case 'set-lower-visible':
        this.lower.visible = payload;
        this.broadcastThis('messages-lower', this.lower);
        break;

      default:
        break;
    }
  }

  _listenToConnections() {
    this.io.on('connection', (socket) => {
      /*******************************/
      /***  HANDLE NEW CONNECTION  ***/
      /***  ---------------------  ***/
      /*******************************/
      // keep track of connections
      this._numClients++;
      console.log(
        `EventTimer: ${this._numClients} Clients with new connection: ${socket.id}`
      );

      // send state
      socket.emit('timer', this.getObject());
      socket.emit('playstate', this.state);
      socket.emit('selected-id', this.selectedEventId);
      socket.emit('next-id', this.nextEventId);
      socket.emit('publicselected-id', this.selectedPublicEventId);
      socket.emit('publicnext-id', this.nextPublicEventId);

      /********************************/
      /***  HANDLE DISCONNECT USER  ***/
      /***  ----------------------  ***/
      /********************************/
      socket.on('disconnect', () => {
        this._numClients--;
        console.log(
          `EventTimer: Client disconnected, total now: ${this._numClients}`
        );
      });

      /***************************************/
      /***  TIMER STATE GETTERS / SETTERS  ***/
      /***  -----------------------------  ***/
      /***************************************/

      /*******************************************/
      // general playback state
      socket.on('get-state', () => {
        socket.emit('timer', this.getObject());
        socket.emit('playstate', this.state);
        socket.emit('selected-id', this.selectedEventId);
        socket.emit('next-id', this.nextEventId);
        socket.emit('publicselected-id', this.selectedPublicEventId);
        socket.emit('publicnext-id', this.this.nextPublicEventId);
      });

      /*******************************************/
      // timer
      socket.on('get-current', () => {
        socket.emit('current', this.getCurrentInSeconds());
      });

      socket.on('get-timer', () => {
        socket.emit('timer', this.getObject());
      });

      socket.on('increment-timer', (data) => {
        if (isNaN(parseInt(data))) return;
        if (data < -5 || data > 5) return;
        this.increment(data * 1000 * 60);
      });

      /*******************************************/
      // playstate
      socket.on('set-playstate', (data) => {
        this.trigger(data);
      });

      socket.on('get-playstate', () => {
        socket.emit('playstate', this.state);
      });

      /*******************************************/
      // selection data
      socket.on('get-selected', () => {
        socket.emit('selected', {
          id: this.selectedEventId,
          index: this.selectedEventIndex,
          total: this.numEvents,
        });
      });

      socket.on('get-selected-id', () => {
        socket.emit('selected-id', this.selectedEventId);
      });

      socket.on('get-next-id', () => {
        socket.emit('next-id', this.nextEventId);
      });

      socket.on('get-publicselected-id', () => {
        socket.emit('publicselected-id', this.selectedPublicEventId);
      });

      socket.on('get-publicnext-id', () => {
        socket.emit('publicnext-id', this.nextPublicEventId);
      });

      // title data
      socket.on('get-titles', () => {
        socket.emit('titles', this.titles);
      });

      // title data
      socket.on('get-publictitles', () => {
        socket.emit('publictitles', this.titlesPublic);
      });

      /***********************************/
      /***  MESSAGE GETTERS / SETTERS  ***/
      /***  -------------------------  ***/
      /***********************************/

      /*******************************************/

      // Messages
      socket.on('get-messages', () => {
        this.broadcastThis('messages-presenter', this.presenter);
        this.broadcastThis('messages-public', this.public);
        this.broadcastThis('messages-lower', this.lower);
      });

      // Presenter message
      socket.on('set-presenter-text', (data) => {
        this._setterManager('set-presenter-text', data);
      });

      socket.on('set-presenter-visible', (data) => {
        this._setterManager('set-presenter-visible', data);
      });

      socket.on('get-presenter', () => {
        this.broadcastThis('messages-presenter', this.presenter);
      });
      /*******************************************/
      // Public message
      socket.on('set-public-text', (data) => {
        this._setterManager('set-public-text', data);
      });

      socket.on('set-public-visible', (data) => {
        this._setterManager('set-public-visible', data);
      });

      socket.on('get-public', () => {
        socket.emit('messages-public', this.public);
      });

      /*******************************************/
      // Lower third message
      socket.on('set-lower-text', (data) => {
        this._setterManager('set-lower-text', data);
      });

      socket.on('set-lower-visible', (data) => {
        this._setterManager('set-lower-visible', data);
      });

      socket.on('get-lower', () => {
        socket.emit('messages-lower', this.lower);
      });
    });
  }

  clearEventList() {
    // unload events
    this.unload();

    // set general
    this._eventlist = [];
    this.numEvents = 0;

    // update lifecycle: onStop
    this.ontimeCycle = this.cycleState.onStop;
  }

  setupWithEventList(eventlist) {
    if (!Array.isArray(eventlist) || eventlist.length < 1) return;

    // filter only events
    const events = eventlist.filter((e) => e.type === 'event');
    const numEvents = events.length;

    // set general
    this._eventlist = events;
    this.numEvents = numEvents;

    // list may be empty
    if (numEvents < 1) return;

    // load first event
    this.loadEvent(0);

    // run cycle
    this.runCycle();
  }

  updateEventList(eventlist) {
    // filter only events
    const events = eventlist.filter((e) => e.type === 'event');
    const numEvents = events.length;

    // is this the first event
    let first = this.numEvents === 0;

    // set general
    this._eventlist = events;
    this.numEvents = numEvents;

    // list may be empty
    if (numEvents < 1) {
      this.unload();
      return;
    }

    // auto load if is the only event
    if (first) {
      this.loadEvent(0);
    } else if (this.selectedEventId != null) {
      // handle reload selected
      // Look for event (order might have changed)
      const eventIndex = this._eventlist.findIndex(
        (e) => e.id === this.selectedEventId
      );

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

    // run cycle
    this.runCycle();
  }

  updateSingleEvent(id, entry) {
    // find object in events
    const eventIndex = this._eventlist.findIndex((e) => e.id === id);
    if (eventIndex === -1) return;

    // update event in memory
    const e = this._eventlist[eventIndex];
    this._eventlist[eventIndex] = {...e, ...entry};

    try {
      // check if entry is running
      if (e.id === this.selectedEventId) {
        // handle reload selected
        // Reload data if running
        let type =
          this.selectedEventId === id && this._startedAt != null
            ? 'reload'
            : 'load';
        this.loadEvent(this.selectedEventIndex, type);
      } else if (e.id === this.nextEventId) {
        // roll needs to recalculate
        if (this.state === 'roll') {
          this.rollLoad();
        }
      }

      // load titles
      if ('title' in e || 'subtitle' in e || 'presenter' in e) {
        // TODO: should be more selective on the need to load titles
        this._loadTitlesNext();
        this._loadTitlesNow();
      }
    } catch (error) {
      console.log(error);
    }

    // run cycle
    this.runCycle();
  }

  deleteId(eventId) {
    // find object in events
    const eventIndex = this._eventlist.findIndex((e) => e.id === eventId);
    if (eventIndex === -1) return;

    // delete event and update count
    this._eventlist.splice(eventIndex, 1);
    this.numEvents = this._eventlist.length;

    // reload data if necessary
    if (eventId === this.selectedEventId) {
      this.unload();
      return;
    }

    // update selected event index
    this.selectedEventIndex = this._eventlist.findIndex(
      (e) => e.id === this.selectedEventId
    );

    // reload titles if necessary
    if (eventId === this.nextEventId || eventId === this.nextPublicEventId) {
      this._loadTitlesNext();
    } else if (eventId === this.selectedPublicEventId) {
      this._loadTitlesNow();
    }

    // run cycle
    this.runCycle();
  }

  /**
   * @description loads an event with a given Id
   * @param eventId - ID of event in eventlist
   */
  loadEventById(eventId) {
    const eventIndex = this._eventlist.findIndex((e) => e.id === eventId);

    if (eventIndex === -1) return;
    this.pause();
    this.loadEvent(eventIndex, 'load', true);
    // run cycle
    this.runCycle();
  }

  /**
   * @description loads an event with a given index
   * @param eventIndex - Index of event in eventlist
   */
  loadEventByIndex(eventIndex) {
    if (eventIndex === -1 || eventIndex > this.numEvents) return;
    this.pause();
    this.loadEvent(eventIndex, 'load', true);
    // run cycle
    this.runCycle();
  }

  // Loads a given event
  // load timers
  // load selectedEventIndex
  // load titles
  loadEvent(eventIndex, type = 'load') {
    const e = this._eventlist[eventIndex];
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
      const now = this._getCurrentTime();
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

  _loadTitlesNow() {
    const e = this._eventlist[this.selectedEventIndex];
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
        if (
          this._eventlist[i].type === 'event' &&
          this._eventlist[i].isPublic
        ) {
          this._loadThisTitles(this._eventlist[i], 'now-public');
          break;
        }
      }
    }
  }

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

    if (this.selectedEventIndex < this.numEvents - 1) {
      let nextPublic = false;
      let nextPrivate = false;

      for (let i = this.selectedEventIndex + 1; i < this.numEvents; i++) {
        // check that is the right type
        if (this._eventlist[i].type === 'event') {
          // if we have not set private
          if (!nextPrivate) {
            this._loadThisTitles(this._eventlist[i], 'next-private');
            nextPrivate = true;
          }

          // if event is public
          if (this._eventlist[i].isPublic) {
            this._loadThisTitles(this._eventlist[i], 'next-public');
            nextPublic = true;
          }
        }

        // Stop if both are set
        if (nextPublic && nextPrivate) break;
      }
    }
  }

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

  print() {
    return `
      Timer
      =========

      Playback
      ------------------------------
      state           = ${this.state}
      current         = ${this.current}
      duration        = ${this.duration}
      secondaryTimer  = ${this.secondaryTimer}

      Events
      ------------------------------
      numEvents             = ${this.numEvents}
      selectedEventIndex    = ${this.selectedEventIndex}
      selectedEventId       = ${this.selectedEventId}
      nextEventId           = ${this.nextEventId}
      selectedPublicEventId = ${this.selectedPublicEventId}
      nextPublicEventId     = ${this.nextPublicEventId}

      Private Titles
      ------------------------------
      NowID           = ${this.selectedEventId}
      NextID          = ${this.nextEventId}
      Title Now       = ${this.titles.titleNow}
      Subtitle Now    = ${this.titles.subtitleNow}
      Presenter Now   = ${this.titles.presenterNow}
      Note Now        = ${this.titles.noteNow}
      Title Next      = ${this.titles.titleNext}
      Subtitle Next   = ${this.titles.subtitleNext}
      Presenter Next  = ${this.titles.presenterNext}
      Note Next       = ${this.titles.noteNext}

      Public Titles
      ------------------------------
      NowID           = ${this.selectedPublicEventId}
      NextID          = ${this.nextPublicEventId}
      Title Now       = ${this.titlesPublic.titleNow}
      Subtitle Now    = ${this.titlesPublic.subtitleNow}
      Presenter Now   = ${this.titlesPublic.presenterNow}
      Title Next      = ${this.titlesPublic.titleNext}
      Subtitle Next   = ${this.titlesPublic.subtitleNext}
      Presenter Next  = ${this.titlesPublic.presenterNext}

      Messages
      ------------------------------
      presenter text  = ${this.presenter.text}
      presenter vis   = ${this.presenter.visible}
      public text     = ${this.public.text}
      public vis      = ${this.public.visible}
      lower text      = ${this.lower.text}
      lower vis       = ${this.lower.visible}

      Private
      ------------------------------
      finishAt        = ${this._finishAt}
      finished        = ${this._finishedAt}
      startedAt       = ${this._startedAt}
      pausedAt        = ${this._pausedAt}
      pausedInterval  = ${this._pausedInterval}
      pausedTotal     = ${this._pausedTotal}

      Socket
      ------------------------------
      numClients      = ${this._numClients}
    `;
  }

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

  stop() {
    // do we need to change
    if (this.state === 'stop') return;

    // call super
    super.stop();

    // update lifecycle: onPause
    this.ontimeCycle = this.cycleState.onStop;
  }

  increment(amount) {
    // call super
    super.increment(amount);

    // run cycle
    this.runCycle();
  }

  rollLoad() {
    const now = this._getCurrentTime();
    let prevLoaded = this.selectedEventId;

    // maybe roll has already been loaded
    if (this.secondaryTimer === null) {
      this._resetTimers(true);
      this._resetSelection();
    }

    const {
      nowIndex,
      nowId,
      publicIndex,
      nextIndex,
      publicNextIndex,
      timers,
      timeToNext,
    } = getSelectionByRoll(this._eventlist, now);

    // nothing to play, unload
    if (nowIndex === null && nextIndex === null) {
      this.unload();
      console.log('Roll: no events found');
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
        if (this.secondaryTimer === null)
          console.log('Roll: waiting for event start');

        // reset running timer
        // ??? should this not have been reset?
        this.current = null;

        // timer counts to next event
        this.secondaryTimer = timeToNext;
        this._secondaryTarget = this._eventlist[nextIndex].timeStart;
      }

      // TITLES: Load next private
      this._loadThisTitles(this._eventlist[nextIndex], 'next-private');
    }

    // TITLES: Load next public
    if (publicNextIndex !== null) {
      this._loadThisTitles(this._eventlist[publicNextIndex], 'next-public');
    }

    // TITLES: Load now private
    if (nowIndex !== null) {
      this._loadThisTitles(this._eventlist[nowIndex], 'now-private');
    }
    // TITLES: Load now public
    if (publicIndex !== null) {
      this._loadThisTitles(this._eventlist[publicIndex], 'now-public');
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

    // set state
    this.state = 'roll';

    // load into event
    this.rollLoad();

    // broadcast change
    this.broadcastState();
  }

  previous() {
    // check that we have events to run
    if (this.numEvents < 1) return;

    // maybe this is the first event?
    if (this.selectedEventIndex === 0) return;

    // if there is no event running, go to first
    if (this.selectedEventIndex == null) {
      this.loadEvent(0);
      return;
    }

    // send OSC
    this.osc.send(this.osc.implemented.previous);

    // change playstate
    this.pause();

    const gotoEvent =
      this.selectedEventIndex > 0 ? this.selectedEventIndex - 1 : 0;

    if (gotoEvent === this.selectedEventIndex) return;
    this.loadEvent(gotoEvent);
  }

  next() {
    // check that we have events to run
    if (this.numEvents < 1) return;

    // maybe this is the last event?
    if (this.selectedEventIndex === this.numEvents - 1) return;

    // if there is no event running, go to first
    if (this.selectedEventIndex == null) {
      this.loadEvent(0);
      return;
    }

    // send OSC
    this.osc.send(this.osc.implemented.next);

    // change playstate
    this.pause();

    const gotoEvent =
      this.selectedEventIndex < this.numEvents - 1
        ? this.selectedEventIndex + 1
        : this.numEvents - 1;

    if (gotoEvent === this.selectedEventIndex) return;
    this.loadEvent(gotoEvent);
  }

  unload() {
    // reset timer
    this._resetTimers(true);

    // reset selected
    this._resetSelection();

    // reset playstate
    this.stop();
  }

  reload() {
    // change playstate
    this.pause();

    // send OSC
    this.osc.send(this.osc.implemented.reload);

    // reload data
    this.loadEvent(this.selectedEventIndex);
  }
}
