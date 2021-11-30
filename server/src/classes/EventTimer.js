import { Timer } from './Timer.js';
import { Server } from 'socket.io';
import {DAY_TO_MS, getSelectionByRoll} from './classUtils.js';

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
    onStart: 'onStart',
    onUpdate: 'onUpdate',
    onPause: 'onPause',
    onStop: 'onStop',
    onFinish: 'onFinish',
  };
  ontimeCycle = 'idle';

  // Socket IO Object
  io = null;

  // OSC Client
  oscClient = null;

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

  constructor(httpServer, oscClient, config) {
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

    // set recurrent emits
    this._interval = setInterval(
      () => this.update(),
      config.timer.refresh
    );

    // listen to new connections
    this._listenToConnections();

    // set oscClient
    this.updateOSCClient(oscClient);
  }

  /**
   * @description Updates the osc client used in the object
   * @param {object} oscClient
   */
  updateOSCClient(oscClient) {
    this.oscClient = oscClient;
  }

  /**
   * @description Sends osc value from predefined messages
   * @param {string} event - message to be sent
   */
  sendOSC(event) {
    if (this.oscClient == null) return;

    const add = '/ontime';
    const play = 'play';
    const pause = 'pause';
    const stop = 'stop';
    const prev = 'prev';
    const next = 'next';
    const reload = 'reload';
    const finished = 'finished';
    const time = this.timeTag;
    const overtime = this.current > 0 ? 0 : 1;
    const title = this.titles?.titleNow || '';
    const presenter = this.titles?.presenterNow || '';

    switch (event) {
      case 'time':
        // Send Timetag Message
        this.oscClient.send(add + '/time', time, (err) => {
          if (err) console.error(err);
        });
        break;
      case 'finished':
        // Runs when timer reaches 0
        this.oscClient.send(add, finished, (err) => {
          if (err) console.error(err);
        });
        break;
      case 'overtime':
        // Whether timer is negative
        this.oscClient.send(add + '/overtime', overtime, (err) => {
          if (err) console.error(err);
        });
        break;
      case 'titles':
        // Send Title of current event
        this.oscClient.send(add + '/title', title, (err) => {
          if (err) console.error(err);
        });

        // Send presenter data on current event
        this.oscClient.send(add + '/presenter', presenter, (err) => {
          if (err) console.error(err);
        });
        break;
      case 'play':
        // Play Message
        this.oscClient.send(add, play, (err) => {
          if (err) console.error(err);
        });
        break;
      case 'pause':
        // Pause Message
        this.oscClient.send(add, pause, (err) => {
          if (err) console.error(err);
        });
        break;
      case 'stop':
        // Stop Message
        this.oscClient.send(add, stop, (err) => {
          if (err) console.error(err);
        });
        break;
      case 'prev':
        this.oscClient.send(add, prev, (err) => {
          if (err) console.error(err);
        });
        break;
      case 'next':
        this.oscClient.send(add, next, (err) => {
          if (err) console.error(err);
        });
        break;
      case 'reload':
        this.oscClient.send(add, reload, (err) => {
          if (err) console.error(err);
        });
        break;

      default:
        break;
    }
  }

  /**
   * @description Shutdown process
   */
  shutdown() {
    console.log('Closing socket server');
    this.io.close();
  }

  // send current timer
  broadcastTimer() {
    // through websockets
    this.io.emit('timer', this.getObject());

    // through OSC, only if running
    if (this.state === 'start' || this.state === 'roll') {
      this.sendOSC('time');
      this.sendOSC('overtime');
      this.sendOSC('titles');
    }
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
   * @description Runs at the start and ends of every cycle,
   * and checks what actions are to be taken according to
   * ontimeCycle
   */
  runCycle() {
    // update lifecycle: onFinish
//    this.ontimeCycle = this.cycleState.onStart;
    switch (this.ontimeCycle) {
      case "idle":
        break;
      case "onLoad":
        // broadcast change
        this.broadcastState();
        break;
      case "onStart":
        // broadcast current state
        this.broadcastState();
        // send OSC
        this.sendOSC('play');
        break;
      case "onUpdate":
        // broadcast current state
        this.broadcastState();
        break;
      case "onPause":
        // broadcast current state
        this.broadcastState();
        // send OSC
        this.sendOSC('pause');
        break;
      case "onStop":
        // broadcast change
        this.broadcastState();
        // send OSC
        this.sendOSC('stop');
        // update lifecycle: idle
        this.ontimeCycle = this.cycleState.idle;
        break;
      case "onFinish":
        // finished an event
        this.sendOSC('finished');
        break;
      default:
        console.log(`ERROR: Unhandled cycle ${this.ontimeCycle}`)
    }
  }

  update() {
    // if there is nothing selected, do nothing
    if (this.selectedEventId == null && this.state !== 'roll') return;
    const now = this._getCurrentTime();
    const isUpdating = (this.state === 'start' || this.state === 'roll');

    if (isUpdating) {
      // update lifecycle: onUpdate
      this.ontimeCycle = this.cycleState.onUpdate;
    }

    // only implement roll here
    if (this.state !== 'roll') {
      super.update();
    } else {
      // update timer as usual
      this.clock = now;
      if (this.selectedEventId && this.current > 0) {
        // something is running, update
        this.current = this._finishAt - now;
      } else if (this.secondaryTimer > 0) {
        // waiting to start, update secondary
        this.secondaryTimer = this._secondaryTarget - now;
      }

      // look for event if none is loaded
      const currentRunning = this.current <= 0 && this.current !== null;
      const secondaryRunning =
        this.secondaryTimer <= 0 && this.secondaryTimer !== null;

      if (currentRunning) {
        // update lifecycle: onFinish
        this.ontimeCycle = this.cycleState.onFinish;
      }

      if (currentRunning || secondaryRunning) {
        // look for events
        this.rollLoad();
        // broadcast state without recalculating timer
        // this.broadcastState(false);
      }
    }

    // if event is finished
    if (
      this.current <= 0
      && isUpdating
      && this.ontimeCycle !== this.cycleState.onFinish
    ) {
      if (this._finishedAt === null) {
        this._finishedAt = now;
      }
      // update lifecycle: onFinish
      this.ontimeCycle = this.cycleState.onFinish;
    }

    // update lifecycle
    this.runCycle()
  }

  _setterManager(action, payload) {
    switch (action) {
      /*******************************************/
      // playstate
      case 'set-playstate':
        // check state is defined
        if (payload === 'start') this.start();
        else if (payload === 'pause') this.pause();
        else if (payload === 'stop') this.stop();
        else if (payload === 'previous') this.previous();
        else if (payload === 'next') this.next();
        else if (payload === 'reload') this.reload();
        else if (payload === 'unload') this.unload();
        else if (payload === 'roll') this.roll();

        // TODO: Cleanup
        // here tdo this.broadcastState;
        // remove broadcast from functions
        this.broadcastThis('playstate', this.state);
        this.broadcastThis('selected-id', this.selectedEventId);
        this.broadcastThis('titles', this.titles);

        break;

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
        this._setterManager('set-playstate', data);
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
  }

  updateSingleEvent(id, entry) {
    // find object in events
    const eventIndex = this._eventlist.findIndex((e) => e.id === id);
    if (eventIndex === -1) return;

    // update event in memory
    const e = this._eventlist[eventIndex];
    this._eventlist[eventIndex] = { ...e, ...entry };

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
  }

  loadEventById(eventId) {
    const eventIndex = this._eventlist.findIndex((e) => e.id === eventId);

    if (eventIndex === -1) return;
    this.pause();
    this.loadEvent(eventIndex, 'load', true);
  }

  loadEventByIndex(eventIndex) {
    if (eventIndex === -1 || eventIndex > this.numEvents) return;
    this.pause();
    this.loadEvent(eventIndex, 'load', true);
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
    // if there is nothing selected, no nothing
    if (this.selectedEventId == null) return;

    // call super
    super.start();

    // update lifecycle: onStart
    this.ontimeCycle = this.cycleState.onStart;
  }

  pause() {
    // if there is nothing selected, no nothing
    if (this.selectedEventId == null) return;

    // call super
    super.pause();

    // update lifecycle: onPause
    this.ontimeCycle = this.cycleState.onPause;

  }

  stop() {
    // call super
    super.stop();

    // update lifecycle: onPause
    this.ontimeCycle = this.cycleState.onStop;
  }

  increment(amount) {
    // call super
    super.increment(amount);

    // increment is unhandled by lifecyle
    // broadcast here
    // broadcast current state
    this.broadcastState();
  }

  rollLoad() {
    const now = this._getCurrentTime();

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
  }

  roll() {
    // do we need to change
    if (this.state === 'roll') return;

    // set state
    this.state = 'roll';

    // load into event
    this.rollLoad();

    this.broadcastState();
  }

  previous() {
    // check that we have events to run
    if (this.numEvents < 1) return;

    // if there is no event running, go to first
    if (this.selectedEventIndex == null) {
      this.loadEvent(0);
      return;
    }

    // send OSC
    this.sendOSC('prev');

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

    // if there is no event running, go to first
    if (this.selectedEventIndex == null) {
      this.loadEvent(0);
      return;
    }

    // send OSC
    this.sendOSC('next');

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
    // reset playstate
    this.pause();

    // send OSC
    this.sendOSC('reload');

    // reload data
    this.loadEvent(this.selectedEventIndex);
  }
}
