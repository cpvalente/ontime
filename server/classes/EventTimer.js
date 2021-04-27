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
  // AUX
  DAYMS = 86400000;

  // Socket IO Object
  io = null;
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
    titleNext: null,
    subtitleNext: null,
    presenterNext: null,
  };

  selectedEvent = null;
  selectedEventId = null;
  nextEventId = null;
  selectedPublicEventId = null;
  nextPublicEventId = null;
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

  // broadcast state
  broadcastState() {
    this.io.emit('timer', this.getObject());
    this.io.emit('playstate', this.state);
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

  update() {
    // if there is nothing selected, no nothing
    if (this.selectedEventId == null) return;
    super.update();
  }

  start() {
    // if there is nothing selected, no nothing
    if (this.selectedEventId == null) return;
    super.start();
  }

  pause() {
    // if there is nothing selected, no nothing
    if (this.selectedEventId == null) return;
    super.pause();
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

        // Not yet implemented
        // else if (payload === 'roll') this.roll();

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

    // set general
    this._eventList = events;
    this.numEvents = events.length;

    // handle reload selected
    if (this.selectedEventId != null) {
      // Look for event (order might have changed)
      const eventIndex = this._eventList.findIndex(
        (e) => e.id === this.selectedEventId
      );

      // Maybe is missing
      if (eventIndex === -1) {
        this._resetTimers();
        this._resetSelection();
        return;
      }

      // Reload data if running
      let type = this._startedAt != null ? 'reload' : 'load';
      this.loadEvent(eventIndex, type);
    }
    this.broadcastState();
  }

  updateSingleEvent(id, entry) {
    // find object in events
    const eventIndex = this._eventList.findIndex((e) => e.id === id);
    if (eventIndex === -1) return;

    // update events
    const e = this._eventList[eventIndex];
    this._eventList[eventIndex] = { ...e, ...entry };

    // handle reload selected
    // Reload data if running
    let type =
      this.selectedEventId === id && this._startedAt != null
        ? 'reload'
        : 'load';
    this.loadEvent(this.selectedEvent, type);

    this.broadcastState();
  }

  // Loads a given event
  loadEvent(eventIndex, type = 'load') {
    const e = this._eventList[eventIndex];

    const start = e.timeStart == null || e.timeStart === '' ? 0 : e.timeStart;
    let end = e.timeEnd == null || e.timeEnd === '' ? 0 : e.timeEnd;
    // in case the end is earlier than start, we assume is the day after
    if (end < start) end += this.DAYMS;

    // time stuff changes on wheter we keep the running clock
    if (type === 'load') {
      this._resetTimers();
      this.duration = end - start;
      this.current = this.duration;
      this.selectedEvent = eventIndex;
      this.selectedEventId = e.id;
    } else if (type === 'reload') {
      const now = this._getCurrentTime();
      const elapsed = this.getElapsed();

      this.duration = end - start;
      this.selectedEvent = eventIndex;
      this._finishAt = now + (this.duration - elapsed);
    }

    // load current titles
    this._loadTitlesNow(e, eventIndex);

    // look for event after
    this._loadTitlesNext(eventIndex);
  }

  _loadTitlesNow(e, eventIndex) {
    // private title is always current
    this.titles.titleNow = e.title;
    this.titles.subtitleNow = e.subtitle;
    this.titles.presenterNow = e.presenter;
    this.selectedEventId = e.id;

    // check if current is also public
    if (e.isPublic) {
      this.titlesPublic.titleNow = e.title;
      this.titlesPublic.subtitleNow = e.subtitle;
      this.titlesPublic.presenterNow = e.presenter;
      this.selectedPublicEventId = e.id;
    } else {
      // assume there is no public event
      this.titlesPublic.titleNow = null;
      this.titlesPublic.subtitleNow = null;
      this.titlesPublic.presenterNow = null;
      this.selectedPublicEventId = null;

      // if there is nothing before, return
      if (eventIndex === 0) return;

      // iterate backwards to find it
      for (let i = eventIndex; i >= 0; i--) {
        if (
          this._eventList[i].type === 'event' &&
          this._eventList[i].isPublic
        ) {
          this.titlesPublic.titleNow = this._eventList[i].title;
          this.titlesPublic.subtitleNow = this._eventList[i].subtitle;
          this.titlesPublic.presenterNow = this._eventList[i].presenter;
          this.selectedPublicEventId = this._eventList[i].id;
          break;
        }
      }
    }
  }

  _loadTitlesNext(eventIndex) {
    // assume there is no next event
    this.titles.titleNext = null;
    this.titles.subtitleNext = null;
    this.titles.presenterNext = null;
    this.nextEventId = null;

    this.titlesPublic.titleNext = null;
    this.titlesPublic.subtitleNext = null;
    this.titlesPublic.presenterNext = null;
    this.nextPublicEventId = null;

    if (eventIndex < this.numEvents - 1) {
      let nextPublic = false;
      let nextPrivate = false;

      for (let i = eventIndex + 1; i < this.numEvents; i++) {
        // check that is the right type
        if (this._eventList[i].type === 'event') {
          // if we have not set private
          if (!nextPrivate) {
            this.titles.titleNext = this._eventList[i].title;
            this.titles.subtitleNext = this._eventList[i].subtitle;
            this.titles.presenterNext = this._eventList[i].presenter;
            this.nextEventId = this._eventList[i].id;
            nextPrivate = true;
          }

          // if event is public
          if (this._eventList[i].isPublic) {
            this.titlesPublic.titleNext = this._eventList[i].title;
            this.titlesPublic.subtitleNext = this._eventList[i].subtitle;
            this.titlesPublic.presenterNext = this._eventList[i].presenter;
            this.nextPublicEventId = this._eventList[i].id;
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
      titleNext: null,
      subtitleNext: null,
      presenterNext: null,
    };

    this.publicTitles = {
      titleNow: null,
      subtitleNow: null,
      presenterNow: null,
      titleNext: null,
      subtitleNext: null,
      presenterNext: null,
    };

    this.selectedEvent = null;
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

      Options
      ------------------------------
      showNegative    = ${this.showNegative}

      Events
      ------------------------------
      numEvents       = ${this.numEvents}
      selectedEvent   = ${this.selectedEvent}

      Private Titles
      ------------------------------
      NowID           = ${this.selectedEventId}
      NextID          = ${this.nextEventId}
      Title Now       = ${this.titles.titleNow}
      Subtitle Now    = ${this.titles.subtitleNow}
      Presenter Now   = ${this.titles.presenterNow}
      Title Next      = ${this.titles.titleNext}
      Subtitle Next   = ${this.titles.subtitleNext}
      Presenter Next  = ${this.titles.presenterNext}

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
      startedAt       = ${this._startedAt}
      pausedAt        = ${this._pausedAt}
      pausedInterval  = ${this._pausedInterval}
      pausedTotal     = ${this._pausedTotal}
    `;
  }

  start() {
    // call super
    super.start();

    // broadcast current state
    this.broadcastState();
  }

  pause() {
    // call super
    super.pause();

    // broadcast current state
    this.broadcastState();
  }

  stop() {
    // call super
    super.stop();

    // broadcast current state
    this.broadcastState();
  }

  increment(amount) {
    // call super
    super.increment(amount);

    // broadcast current state
    this.broadcastState();
  }

  goto(eventIndex) {
    // load event
    this.loadEvent(eventIndex);

    // broadcast current state
    this.broadcastState();
  }

  roll() {
    console.log('roll: not yet implemented');
    return false;
    this.state = 'roll';
  }

  previous() {
    // check that we have events to run
    if (this.numEvents < 1) return;

    // change playstate
    this.state = 'pause';

    // if there is no event running, go to first
    if (this.selectedEvent == null) {
      this.goto(0);
      return;
    }
    const gotoEvent = this.selectedEvent > 0 ? this.selectedEvent - 1 : 0;

    if (gotoEvent === this.selectedEvent) return;
    this.goto(gotoEvent);

    // broadcast current state
    this.broadcastState();
  }

  next() {
    // check that we have events to run
    if (this.numEvents < 1) return;

    // change playstate
    this.state = 'pause';

    // if there is no event running, go to first
    if (this.selectedEvent == null) {
      this.goto(0);
      return;
    }

    const gotoEvent =
      this.selectedEvent < this.numEvents - 1
        ? this.selectedEvent + 1
        : this.numEvents - 1;

    if (gotoEvent === this.selectedEvent) return;
    this.goto(gotoEvent);

    // broadcast current state
    this.broadcastState();
  }

  unload() {
    // reset duration
    this.duration = null;

    // reset timers
    this._resetTimers();

    // reset playstate
    this.state = 'stop';

    // reset selected
    this._resetSelection();

    // broadcast current state
    this.broadcastState();
  }

  reload() {
    // reload data
    this.loadEvent(this.selectedEvent);

    // reset playstate
    this.state = 'pause';

    // broadcast current state
    this.broadcastState();
  }
}

module.exports = EventTimer;
