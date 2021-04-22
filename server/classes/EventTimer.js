const Timer = require('./Timer');
const socketIo = require('socket.io');

/*
 * EventTimer adds functions specific to APP
 * namely:
 * - Presenter message, text and status
 * - Public message, text and status
 *
 */

class EventTimer extends Timer {
  // Socket IO Object
  io = null;

  // Socket IO helpers
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

  titles = {
    titleNow: null,
    subtitleNow: null,
    presenterNow: null,
    titleNext: null,
    subtitleNext: null,
    presenterNext: null,
  };

  selectedEvent = null;
  selectedEventId = null;
  numEvents = null;
  _eventlist = null;

  constructor(server, config) {
    // call super constructor
    super();

    // initialise socketIO server
    this.io = socketIo(server, {
      cors: {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
      },
    });

    // set recurrent emits
    this._interval = setInterval(
      () => this.broadcastTimer(),
      config.timer.refresh
    );

    // listen to new connections
    this._listenToConnections();
  }

  // send current timer
  broadcastTimer() {
    this.io.emit('timer', this.getObject());
  }

  // broadcast message
  broadcastThis(address, payload) {
    this.io.emit(address, payload);
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
        // Not yet implemented
        // else if (payload === 'roll') this.roll();
        // else if (payload === 'release') this.roll();
        this.broadcastThis('playstate', this.playState);
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
      this._numClients++;
      console.log(
        `EventTimer: ${this._numClients} Clients with new connection: ${socket.id}`
      );

      /********************************/
      /***  HANDLE DISCONNECT USER  ***/
      /***  ----------------------  ***/
      /********************************/
      socket.on('disconnect', () => {
        this._numClients--;
        console.log(
          `EventTimer: Client disconnected, total now: ${this._numClients}`
        );
      })

      /***************************************/
      /***  TIMER STATE GETTERS / SETTERS  ***/
      /***  -----------------------------  ***/
      /***************************************/

      /*******************************************/
      // general playback state
      socket.on('get-state', () => {
        socket.emit('timer', this.getObject());
        socket.emit('playstate', this.playState);
        socket.emit('selected-id', this.selectedEventId);
        socket.emit('titles', this.titles);
      });

      /*******************************************/
      // timer
      socket.on('get-current', () => {
        socket.emit('current', this.getCurrentInSeconds());
      });

      socket.on('get-timer', () => {
        socket.emit('timer', this.getObject());
      });

      /*******************************************/
      // playstate
      socket.on('set-playstate', (data) => {
        this._setterManager('set-playstate', data);
      });

      socket.on('get-playstate', () => {
        socket.emit('playstate', this.playState);
      });

      /*******************************************/
      // titles data
      socket.on('get-selected-id', () => {
        socket.emit('selected-id', this.selectedEventId);
      });

      socket.on('get-titles', () => {
        socket.emit('titles', this.titles);
      });

      /*****************************/
      /***  BROADCAST            ***/
      /***  TIMER STATE GETTERS  ***/
      /***  -------------------  ***/
      /*****************************/

      /*******************************************/
      // playback API
      // ? should i change the address tokeep convention?
      socket.on('get-messages', () => {
        this.broadcastThis('messages-presenter', this.presenter);
        this.broadcastThis('messages-public', this.public);
        this.broadcastThis('messages-lower', this.lower);
      });

      /***********************************/
      /***  MESSAGE GETTERS / SETTERS  ***/
      /***  -------------------------  ***/
      /***********************************/

      /*******************************************/
      // Presenter message
      socket.on('set-presenter-text', (data) => {
        console.log(data);
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

  updateEventList(eventlist) {
    // filter only events
    const events = eventlist.filter((e) => e.type === 'event');

    const numEvents = events.length;

    // set general
    this._eventList = events;
    this.numEvents = numEvents;

    // TODO: What to do about reloading
  }

  loadEvent(eventIndex) {
    // set event specific
    const e = this._eventList[eventIndex];
    const start = e.timeStart == null || e.timeStart === '' ? 0 : e.timeStart;
    let end = e.timeEnd == null || e.timeEnd === '' ? 0 : e.timeEnd;

    // in case the end is earlier than start, we assume is the day after
    if (end < start) end += 86400000;

    // time stuff
    this._resetTimers();
    this.duration = end - start;
    this.current = this.duration;
    this.selectedEvent = eventIndex;
    this.selectedEventId = e.id;

    // event titles
    this.titles.titleNow = e.title;
    this.titles.subtitleNow = e.subtitle;
    this.titles.presenterNow = e.presenter;

    // assume tere is no next event
    this.titles.titleNext = null;
    this.titles.subtitleNext = null;
    this.titles.presenterNext = null;

    // look for event after
    if (eventIndex < this.numEvents - 1) {
      for (let i = eventIndex + 1; i < this.numEvents; i++) {
        // check that is the right type
        if (this._eventList[i].type === 'event') {
          this.titles.titleNext = this._eventList[i].title;
          this.titles.subtitleNext = this._eventList[i].subtitle;
          this.titles.presenterNext = this._eventList[i].presenter;
          break;
        }
      }
    }
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

      Options
      ------------------------------
      showNegative    = ${this.showNegative}

      Events
      ------------------------------
      numEvents       = ${this.numEvents}
      selectedEvent   = ${this.selectedEvent}
      selectedEventId = ${this.selectedEventId}
      title           = ${this.titles.title}
      subtitle        = ${this.titles.subtitle}
      presenter       = ${this.titles.presenter}

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

  set lowerText(text) {
    this.lower.text = text;
  }

  set lowerVisible(state) {
    this.lower.visible = state;
  }

  get presenter() {
    return this.presenter;
  }

  get public() {
    return this.public;
  }

  get lower() {
    return this.lower;
  }

  get titles() {
    return this.titles;
  }

  getEventData() {}

  get events() {
    return this._eventList;
  }

  // Torbjorn: is this a good idea?
  set events(events) {
    this._eventList = events;
  }

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
