import { Timer } from './Timer.js';
import { Server } from 'socket.io';
import { DAY_TO_MS, getSelectionByRoll, replacePlaceholder, updateRoll } from './classUtils.js';
import { OSCIntegration } from './integrations/Osc.js';
import { HTTPIntegration } from './integrations/Http.js';
import { cleanURL } from '../../utils/url.js';
import getRandomName from '../../utils/getRandomName.js';
import { generateId } from '../../utils/generate_id.js';
import { stringFromMillis } from '../../utils/time.js';

/*
 * Class EventTimer adds functions specific to APP
 * @extends Timer
 */

export class EventTimer extends Timer {
  /**
   * Instantiates an event timer object
   * @param {object} httpServer
   * @param {object} timerConfig
   * @param {object} [oscConfig]
   * @param {object} [httpConfig]
   */
  constructor(httpServer, timerConfig, oscConfig, httpConfig) {
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

    // OSC Object
    this.osc = null;

    // HTTP Client Object
    this.http = null;

    this._numClients = 0;
    this._interval = null;

    this.presenter = {
      text: '',
      visible: false,
    };
    this.public = {
      text: '',
      visible: false,
    };
    this.lower = {
      text: '',
      visible: false,
    };

    // call general title reset
    this._resetSelection();

    this._eventlist = [];
    this.onAir = false;

    // initialise socketIO server
    this.messageStack = [];
    this.MAX_MESSAGES = 100;
    this._clientNames = {};
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
      },
    });

    // set recurrent emits
    this._interval = setInterval(() => this.runCycle(), timerConfig?.refresh || 1000);

    // listen to new connections
    this._listenToConnections();

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
    this.info('SERVER', 'Shutting down ontime');
    if (this.io != null) {
      this.info('TX', '... Closing socket server');
      this.io.close();
    }
    if (this.osc != null) {
      this.info('TX', '... Closing OSC Client');
      this.osc.shutdown();
    }
    if (this.http != null) {
      this.info('TX', '... Closing HTTP Client');
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
    r.success ? this.info('TX', r.message) : this.error('TX', r.message);
  }

  /**
   * Initialises HTTP Integration object
   * @param {object} httpConfig
   * @private
   */
  _initHTTPClient(httpConfig) {
    this.info('TX', `Initialise HTTP Client on port`);
    this.http = new HTTPIntegration();
    this.http.init(httpConfig);
    this.httpMessages = httpConfig.messages;
  }

  /**
   * Sends time object over websockets
   */
  broadcastTimer() {
    // through websockets
    this.io.emit('timer', this.getTimeObject());
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
    this.io.emit('ontime-timer', featureData);
  }

  /**
   * @description Broadcast data for Event List feature
   * @private
   */
  _broadcastFeatureEventList() {
    const featureData = {
      selectedEventId: this.selectedEventId,
      nextEventId: this.nextEventId,
    };
    this.io.emit('ontime-feat-eventlist', featureData);
  }

  /**
   * @description Broadcast data for Message Control feature
   * @private
   */
  _broadcastFeatureMessageControl() {
    const featureData = {
      presenter: this.presenter,
      public: this.public,
      lower: this.lower,
      onAir: this.onAir,
    };
    this.io.emit('ontime-feat-messagecontrol', featureData);
  }

  /**
   * @description Broadcast data for Playback Control feature
   * @private
   */
  _broadcastFeaturePlaybackControl() {
    const featureData = {
      playback: this.state,
      selectedEventId: this.selectedEventId,
      numEvents: this._eventlist.length,
    };
    this.io.emit('ontime-feat-playbackcontrol', featureData);
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
      numEvents: this._eventlist.length,
    };
    this.io.emit('ontime-feat-info', featureData);
  }

  _broadcastFeatureCuesheet() {
    const featureData = {
      playback: this.state,
      selectedEventId: this.selectedEventId,
      selectedEventIndex: this.selectedEventIndex,
      numEvents: this._eventlist.length,
      titleNow: this.titles.titleNow,
    };
    this.io.emit('ontime-feat-cuesheet', featureData);
  }

  /**
   * Broadcasts complete object state
   */
  broadcastState() {
    // feature sync
    this._broadcastFeatureEventList();
    this._broadcastFeatureMessageControl();
    this._broadcastFeaturePlaybackControl();
    this._broadcastFeatureInfo();
    this._broadcastFeatureCuesheet();
    this._broadcastFeatureTimer();

    const numEvents = this._eventlist.length;
    this.broadcastTimer();
    this.io.emit('playstate', this.state);
    this.io.emit('selected', {
      id: this.selectedEventId,
      index: this.selectedEventIndex,
      total: numEvents,
    });
    this.io.emit('selected-id', this.selectedEventId);
    this.io.emit('next-id', this.nextEventId);
    this.io.emit('numevents', numEvents);
    this.io.emit('publicselected-id', this.selectedPublicEventId);
    this.io.emit('publicnext-id', this.nextPublicEventId);
    this.io.emit('titles', this.titles);
    this.io.emit('publictitles', this.titlesPublic);
    this.io.emit('onAir', this.onAir);
  }

  /**
   * Broadcast given message
   * @param {string} address - socket io address
   * @param {any} payload - message body
   */
  broadcastThis(address, payload) {
    this.io.emit(address, payload);
  }

  /**
   * @description Interface for triggering playback actions
   * @param {string} action - state to be triggered
   * @param {string|number} [payload] - optional action payload
   * @returns {boolean} Whether action was called
   */
  trigger(action, payload) {
    let success = true;
    const numEvents = this._eventlist.length;
    switch (action) {
      case 'start': {
        if (!numEvents) return false;
        // Call action and force update
        this.info('PLAYBACK', 'Play Mode Start');
        this.start();
        break;
      }
      case 'startById': {
        if (!numEvents) return false;
        const loaded = this.loadEventById(payload);
        if (loaded) {
          this.info('PLAYBACK', `Loaded event with ID ${payload}`);
          this.info('PLAYBACK', 'Play Mode Start');
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
          this.info('PLAYBACK', `Loaded event with index ${payload}`);
          this.info('PLAYBACK', 'Play Mode Start');
          this.start();
        } else {
          return false;
        }
        break;
      }
      case 'pause': {
        if (!numEvents) return false;
        // Call action and force update
        this.info('PLAYBACK', 'Play Mode Pause');
        this.pause();
        break;
      }
      case 'stop': {
        if (!numEvents) return false;
        // Call action and force update
        this.info('PLAYBACK', 'Play Mode Stop');
        this.stop();
        break;
      }
      case 'roll': {
        if (!numEvents) return false;
        // Call action and force update
        this.info('PLAYBACK', 'Play Mode Roll');
        this.roll();
        break;
      }
      case 'previous': {
        if (!numEvents) return false;
        // Call action and force update
        this.info('PLAYBACK', 'Play Mode Previous');
        this.previous();
        break;
      }
      case 'next': {
        if (!numEvents) return false;
        // Call action and force update
        this.info('PLAYBACK', 'Play Mode Next');
        this.next();
        break;
      }
      case 'loadById': {
        if (!numEvents) return false;
        const loaded = this.loadEventById(payload);
        if (loaded) {
          this.info('PLAYBACK', `Loaded event with ID ${payload}`);
        } else {
          return false;
        }
        break;
      }
      case 'loadByIndex': {
        if (!numEvents) return false;
        const loaded = this.loadEventByIndex(payload);
        if (loaded) {
          this.info('PLAYBACK', `Loaded event with index ${payload}`);
        } else {
          return false;
        }
        break;
      }
      case 'unload': {
        if (!numEvents) return false;
        // Call action and force update
        this.info('PLAYBACK', 'Events unloaded');
        this.unload();
        break;
      }
      case 'reload': {
        if (!numEvents) return false;
        // Call action and force update
        this.info('PLAYBACK', 'Reloaded event');
        this.reload();
        break;
      }
      case 'onAir': {
        // Call action
        this.info('PLAYBACK', 'Going On Air');
        this.setonAir(true);
        break;
      }
      case 'offAir': {
        // Call action and force update
        this.info('PLAYBACK', 'Going Off Air');
        this.setonAir(false);
        break;
      }
      default: {
        // Error, disable flag
        this.error('RX', `Unhandled action triggered ${action}`);
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
        this.error('SERVER', `Unhandled cycle: ${this.ontimeCycle}`);
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
    this.clock = this._getCurrentTime();
    this._broadcastFeatureTimer();
    this.broadcastTimer();

    // if we are not updating, send the timers
    if (this.ontimeCycle !== this.cycleState.onUpdate) {
      this.io.emit('timer', this.getTimeObject());
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
   * Set titles and broadcast change
   * @param {string} action
   * @param {any} payload
   * @private
   */
  _setTitles(action, payload) {
    switch (action) {
      /*******************************************/
      // Presenter message
      case 'set-timer-text':
        this.presenter.text = payload;
        this.broadcastThis('messages-timer', this.presenter);
        break;
      case 'set-timer-visible':
        this.presenter.visible = payload;
        this.broadcastThis('messages-timer', this.presenter);
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

  /**
   * Handle socket io connections
   * @private
   */
  _listenToConnections() {
    this.io.on('connection', (socket) => {
      /*******************************/
      /***  HANDLE NEW CONNECTION  ***/
      /***  ---------------------  ***/
      /*******************************/
      // keep track of connections
      this._numClients++;
      this._clientNames[socket.id] = getRandomName();
      const m = `${this._numClients} Clients with new connection: ${this._clientNames[socket.id]}`;
      this.info('CLIENT', m);

      // send state
      socket.emit('timer', this.getTimeObject());
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
        const m = `${this._numClients} Clients with disconnection: ${this._clientNames[socket.id]}`;
        delete this._clientNames[socket.id];
        this.info('CLIENT', m);
      });

      /***************************************/
      /***  TIMER STATE GETTERS / SETTERS  ***/
      /***  ------- WEBSOCKET API -------  ***/
      /***  -----------------------------  ***/
      /***************************************/

      /*******************************************/
      socket.on('ontime-test', () => {
        socket.emit('hello');
      });

      socket.on('set-start', () => {
        this.trigger('start');
        socket.emit('playstate', this.state);
      });

      socket.on('set-startid', (data) => {
        this.trigger('startById', data);
        socket.emit('playstate', this.state);
      });

      socket.on('set-startindex', (data) => {
        const eventIndex = Number(data);
        if (isNaN(eventIndex)) {
          return;
        }
        this.trigger('startByIndex', data);
        socket.emit('playstate', this.state);
      });

      socket.on('set-loadid', (data) => {
        this.trigger('loadById', data);
        socket.emit('playstate', this.state);
      });

      socket.on('set-loadindex', (data) => {
        const eventIndex = Number(data);
        if (isNaN(eventIndex)) {
          return;
        }
        this.trigger('loadByIndex', data);
        socket.emit('playstate', this.state);
      });

      socket.on('set-pause', () => {
        this.trigger('pause');
        socket.emit('playstate', this.state);
      });

      socket.on('set-stop', () => {
        this.trigger('stop');
        socket.emit('playstate', this.state);
      });

      socket.on('set-reload', () => {
        this.trigger('reload');
        socket.emit('playstate', this.state);
      });

      socket.on('set-previous', () => {
        this.trigger('previous');
        socket.emit('playstate', this.state);
      });

      socket.on('set-next', () => {
        this.trigger('next');
        socket.emit('playstate', this.state);
      });

      socket.on('set-roll', () => {
        this.trigger('roll');
        socket.emit('playstate', this.state);
      });

      socket.on('set-delay', (data) => {
        const delayTime = Number(data);
        if (isNaN(delayTime)) {
          return;
        }
        this.increment(delayTime * 1000 * 60);
      });

      socket.on('set-onAir', (data) => {
        try {
          const d = JSON.parse(data);
          this.onAir = !!d;
        } catch (error) {
          this.error('RX', `Failed to parse message ${data}`);
        }
        this.broadcastThis('onAir', this.onAir);
        this._broadcastFeatureMessageControl();
      });

      /*******************************************/
      // general playback state
      socket.on('get-state', () => {
        socket.emit('timer', this.getTimeObject());
        socket.emit('playstate', this.state);
        socket.emit('selected-id', this.selectedEventId);
        socket.emit('next-id', this.nextEventId);
        socket.emit('publicselected-id', this.selectedPublicEventId);
        socket.emit('publicnext-id', this.this.nextPublicEventId);
      });

      /*******************************************/

      // ** TO BE DEPRECATED ** //
      socket.on('get-timer', () => {
        socket.emit('timer', this.getTimeObject());
      });

      // ** TO BE DEPRECATED IN FAVOR OF DELAY ** //
      socket.on('increment-timer', (data) => {
        if (isNaN(parseInt(data, 10))) return;
        if (data < -5 || data > 5) return;
        this.increment(data * 1000 * 60);
      });

      /*******************************************/
      // playstate
      socket.on('set-playstate', (data) => {
        this.trigger(data);
        this._broadcastFeaturePlaybackControl();
        this._broadcastFeatureInfo();
      });

      socket.on('get-playstate', () => {
        socket.emit('playstate', this.state);
      });

      socket.on('get-onAir', () => {
        socket.emit('onAir', this.onAir);
      });

      /*******************************************/
      // selection data
      socket.on('get-selected', () => {
        socket.emit('selected', {
          id: this.selectedEventId,
          index: this.selectedEventIndex,
          total: this._eventlist.length,
        });
      });

      socket.on('get-selected-id', () => {
        socket.emit('selected-id', this.selectedEventId);
      });

      socket.on('get-next-id', () => {
        socket.emit('next-id', this.nextEventId);
      });

      // title data
      socket.on('get-titles', () => {
        socket.emit('titles', this.titles);
      });

      socket.on('get-publictitles', () => {
        socket.emit('publictitles', this.titlesPublic);
      });

      /***********************************/
      /***  MESSAGE GETTERS / SETTERS  ***/
      /***  -------------------------  ***/
      /***********************************/

      /*******************************************/

      // Presenter message
      socket.on('set-timer-message-text', (data) => {
        this._setTitles('set-timer-text', data);
        this._broadcastFeatureMessageControl();
      });

      socket.on('set-timer-message-visible', (data) => {
        this._setTitles('set-timer-visible', data);
        this._broadcastFeatureMessageControl();
      });

      /*******************************************/
      // Public message
      socket.on('set-public-message-text', (data) => {
        this._setTitles('set-public-text', data);
        this._broadcastFeatureMessageControl();
      });

      socket.on('set-public-message-visible', (data) => {
        this._setTitles('set-public-visible', data);
        this._broadcastFeatureMessageControl();
      });

      /*******************************************/
      // Lower third message
      socket.on('set-lower-message-text', (data) => {
        this._setTitles('set-lower-text', data);
        this._broadcastFeatureMessageControl();
      });

      socket.on('set-lower-message-visible', (data) => {
        this._setTitles('set-lower-visible', data);
        this._broadcastFeatureMessageControl();
      });

      /* MOLECULAR ENDPOINTS
       * =====================
       * 1. EVENT LIST
       * 2. MESSAGE CONTROL
       * 3. PLAYBACK CONTROL
       * 4. INFO
       * 5. CUESHEET
       * 6. TIMER OBJECT
       * */

      // 1. EVENT LIST
      socket.on('get-ontime-feat-eventlist', () => {
        this._broadcastFeatureEventList();
      });

      // 2. MESSAGE CONTROL
      socket.on('get-ontime-feat-messagecontrol', () => {
        this._broadcastFeatureMessageControl();
      });

      // 3. PLAYBACK CONTROL
      socket.on('get-ontime-feat-playbackcontrol', () => {
        this._broadcastFeaturePlaybackControl();
      });

      // 4. INFO
      socket.on('get-ontime-feat-info', () => {
        this._broadcastFeatureInfo();
      });

      // 5. CUE SHEET
      socket.on('get-ontime-feat-cuesheet', () => {
        this._broadcastFeatureCuesheet();
      });

      // 6. TIMER
      socket.on('get-ontime-timer', () => {
        this._broadcastFeatureTimer();
      });
    });
  }

  /**
   * Deletes running event list from object
   */
  clearEventList() {
    // unload events
    this.unload();

    // set general
    this._eventlist = [];

    // update lifecycle: onStop
    this.ontimeCycle = this.cycleState.onStop;

    // update clients
    this.broadcastThis('numevents', this._eventlist.length);
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
    this._eventlist = events;

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
    this._eventlist = events;

    // list may be empty
    if (numEvents < 1) {
      this.unload();
      return;
    }

    // auto load if is the there was nothing before
    if (!this._eventlist.length) {
      this.loadEvent(0);
    } else if (this.selectedEventId != null) {
      // handle reload selected
      // Look for event (order might have changed)
      const eventIndex = this._eventlist.findIndex((e) => e.id === this.selectedEventId);

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
    const eventIndex = this._eventlist.findIndex((e) => e.id === id);
    if (eventIndex === -1) {
      throw 'Event not found';
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
    const e = this._eventlist[eventIndex];
    this._eventlist[eventIndex] = { ...e, ...entry };

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
      this.error('SERVER', error);
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
    // find object in events
    const previousIndex = this._eventlist.findIndex((e) => e.id === previousId);
    if (previousIndex === -1) {
      throw 'Event not found';
    }

    if (previousIndex + 1 >= this._eventlist.length) {
      this._eventlist.push(event);
    } else {
      this._eventlist.splice(previousIndex + 1, 0, event);
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
      this.error('SERVER', error);
    }

    // update clients
    this.broadcastState();

    // run cycle
    this.runCycle();
  }

  /**
   * @description inserts an event in the first position of the list
   * @param event
   */
  insertEventAtStart(event) {
    // Insert at beginning
    this._eventlist.unshift(event);

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
    const eventIndex = this._eventlist.findIndex((e) => e.id === eventId);
    if (eventIndex === -1) return;

    // delete event and update count
    this._eventlist.splice(eventIndex, 1);

    // reload data if necessary
    if (eventId === this.selectedEventId) {
      this.unload();
      return;
    }

    // update selected event index
    this.selectedEventIndex = this._eventlist.findIndex((e) => e.id === this.selectedEventId);

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
    const eventIndex = this._eventlist.findIndex((e) => e.id === eventId);

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
    if (eventIndex === -1 || eventIndex > this._eventlist.length) return false;
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
    const e = this._eventlist?.[eventIndex];
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

  /**
   * @description loads given title (now)
   * @private
   */
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
        if (this._eventlist[i].type === 'event' && this._eventlist[i].isPublic) {
          this._loadThisTitles(this._eventlist[i], 'now-public');
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

    const numEvents = this._eventlist.length;

    if (this.selectedEventIndex < numEvents - 1) {
      let nextPublic = false;
      let nextPrivate = false;

      for (let i = this.selectedEventIndex + 1; i < numEvents; i++) {
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
   * @description Set onAir property of timer
   * @param {boolean} onAir - whether flag is active
   */
  setonAir(onAir) {
    this.onAir = onAir;
    // broadcast change
    this.broadcastThis('onAir', onAir);
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
    const now = this._getCurrentTime();
    const prevLoaded = this.selectedEventId;

    // maybe roll has already been loaded
    if (this.secondaryTimer === null) {
      this._resetTimers(true);
      this._resetSelection();
    }

    const { nowIndex, nowId, publicIndex, nextIndex, publicNextIndex, timers, timeToNext } =
      getSelectionByRoll(this._eventlist, now);

    // nothing to play, unload
    if (nowIndex === null && nextIndex === null) {
      this.unload();
      this.warning('SERVER', 'Roll: no events found');
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
          this.info('SERVER', 'Roll: waiting for event start');
        }

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

    if (!this._eventlist.length) return;

    // set state
    this.state = 'roll';

    // update lifecycle: armed
    this.ontimeCycle = this.cycleState.armed;

    // load into event
    this.rollLoad();
  }

  previous() {
    // check that we have events to run
    if (!this._eventlist.length) return;

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
    const numEvents = this._eventlist.length;
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
    if (!this._eventlist.length) return;

    // change playstate
    this.pause();

    // send OSC
    this.sendOsc(this.osc.implemented.reload);

    // reload data
    this.loadEvent(this.selectedEventIndex);
  }

  /****************************************************************************/

  /**
   * Logger logic
   * -------------
   *
   * This should be separate of event timer, left here for convenience
   *
   */

  /**
   * Utility method, sends message and pushes into stack
   * @param {string} level
   * @param {string} origin
   * @param {string} text
   */
  _push(level, origin, text) {
    const m = {
      id: generateId(),
      level,
      origin,
      text,
      time: stringFromMillis(this._getCurrentTime()),
    };

    this.messageStack.unshift(m);
    this.io.emit('logger', m);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${m.level}] \t ${m.origin} \t ${m.text}`);
    }

    if (this.messageStack.length > this.MAX_MESSAGES) {
      this.messageStack.pop();
    }
  }

  /**
   * Sends a message with level LOG
   * @param {string} origin
   * @param {string} text
   */
  info(origin, text) {
    this._push('INFO', origin, text);
  }

  /**
   * Sends a message with level WARN
   * @param {string} origin
   * @param {string} text
   */
  warning(origin, text) {
    this._push('WARN', origin, text);
  }

  /**
   * Sends a message with level ERROR
   * @param {string} origin
   * @param {string} text
   */
  error(origin, text) {
    this._push('ERROR', origin, text);
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
      this.error('TX', reply.message);
    }
  }

  /**
   * Builds sync object
   * @returns {{running: number, timer: (null|string|*), presenter: null, playback: string, clock: null, title: null}}
   */
  poll() {
    return {
      clock: this.clock,
      running: Timer.toSeconds(this.current),
      timer: this.timeTag,
      playback: this.state,
      title: this.titles.titleNow,
      presenter: this.titles.presenterNow,
    };
  }
}
