import { Server } from 'socket.io';
import getRandomName from '../../utils/getRandomName.js';
import { generateId } from '../../utils/generate_id.js';
import { stringFromMillis } from '../../utils/time.js';
import { Timer } from '../timer/Timer.js';

export class SocketController {
  constructor(httpServer) {
    this.numClients = 0;
    this.messageStack = [];
    this._MAX_MESSAGES = 100;
    this._clientNames = {};
    this.socket = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
      },
    });
  }

  startListener() {
    this._socketMessageHandler();
  }

  shutdown() {
    this.info('SERVER', 'Shutting down ontime');
    if (this.socket) {
      this.info('TX', '... Closing socket server');
      this.socket.close();
    }
  }

  /**
   * Handle socket io connections
   * @private
   */
  _socketMessageHandler() {
    this.socket.on('connection', (socket) => {
      /*******************************/
      /***  HANDLE NEW CONNECTION  ***/
      /***  ---------------------  ***/
      /*******************************/
      // keep track of connections
      this.numClients++;
      this._clientNames[socket.id] = getRandomName();
      const message = `${this.numClients} Clients with new connection: ${
        this._clientNames[socket.id]
      }`;
      this.info('CLIENT', message);

      // send state
      socket.emit('timer', global.timer.getTimeObject());
      socket.emit('playstate', global.timer.state);
      socket.emit('selected-id', global.timer.selectedEventId);
      socket.emit('next-id', global.timer.nextEventId);
      socket.emit('publicselected-id', global.timer.selectedPublicEventId);
      socket.emit('publicnext-id', global.timer.nextPublicEventId);

      /**
       * @description handle disconnecting a user
       */
      socket.on('disconnect', () => {
        this.numClients--;
        const message = `${this.numClients} Clients with disconnection: ${
          this._clientNames[socket.id]
        }`;
        delete this._clientNames[socket.id];
        this.info('CLIENT', message);
      });

      /**
       * @description utility for renaming a user
       */
      socket.on('rename-client', (newName) => {
        if (newName) {
          const previousName = this._clientNames[socket.id];
          this._clientNames[socket.id] = newName;
          this.info('CLIENT', `Client ${previousName} renamed to ${newName}`);
        }
      });

      /***************************************/
      /***  TIMER STATE GETTERS / SETTERS  ***/
      /***  ------- WEBSOCKET API -------  ***/
      /***  -----------------------------  ***/
      /***************************************/

      /*******************************************/
      socket.on('ontime-test', () => {
        socket.emit('hello', socket.id);
      });

      socket.on('set-start', () => {
        global.timer.trigger('start');
        socket.emit('playstate', global.timer.state);
      });

      socket.on('set-startid', (data) => {
        global.timer.trigger('startById', data);
        socket.emit('playstate', global.timer.state);
      });

      socket.on('set-startindex', (data) => {
        const eventIndex = Number(data);
        if (isNaN(eventIndex)) {
          return;
        }
        global.timer.trigger('startByIndex', data);
        socket.emit('playstate', global.timer.state);
      });

      socket.on('set-loadid', (data) => {
        global.timer.trigger('loadById', data);
        socket.emit('playstate', global.timer.state);
      });

      socket.on('set-loadindex', (data) => {
        const eventIndex = Number(data);
        if (isNaN(eventIndex)) {
          return;
        }
        global.timer.trigger('loadByIndex', data);
        socket.emit('playstate', global.timer.state);
      });

      socket.on('set-pause', () => {
        global.timer.trigger('pause');
        socket.emit('playstate', global.timer.state);
      });

      socket.on('set-stop', () => {
        global.timer.trigger('stop');
        socket.emit('playstate', global.timer.state);
      });

      socket.on('set-reload', () => {
        global.timer.trigger('reload');
        socket.emit('playstate', global.timer.state);
      });

      socket.on('set-previous', () => {
        global.timer.trigger('previous');
        socket.emit('playstate', global.timer.state);
      });

      socket.on('set-next', () => {
        global.timer.trigger('next');
        socket.emit('playstate', global.timer.state);
      });

      socket.on('set-roll', () => {
        global.timer.trigger('roll');
        socket.emit('playstate', global.timer.state);
      });

      socket.on('set-delay', (data) => {
        const delayTime = Number(data);
        if (isNaN(delayTime)) {
          return;
        }
        global.timer.increment(delayTime * 1000 * 60);
      });

      socket.on('set-onAir', (data) => {
        try {
          const d = JSON.parse(data);
          d ? global.timer.trigger('onAir') : global.timer.trigger('offAir');
        } catch (error) {
          this.error('RX', `Failed to parse message ${data}`);
        }
        this.send('onAir', global.timer.onAir);
        global.timer._broadcastFeatureMessageControl();
      });

      /*******************************************/
      // general playback state, useful for external sync
      socket.on('ontime-poll', () => {
        const timerPoll = global.timer.poll();
        const isDelayed = false;
        const colour = '';
        socket.emit('ontime-poll', { isDelayed, colour, ...timerPoll });
      });

      /*******************************************/

      // ** TO BE DEPRECATED ** //
      socket.on('get-timer', () => {
        socket.emit('timer', global.timer.getTimeObject());
      });

      // ** TO BE DEPRECATED IN FAVOR OF DELAY ** //
      socket.on('increment-timer', (data) => {
        if (isNaN(parseInt(data, 10))) return;
        if (data < -5 || data > 5) return;
        global.timer.increment(data * 1000 * 60);
      });

      /*******************************************/
      // playstate
      socket.on('set-playstate', (data) => {
        global.timer.trigger(data);
        global.timer._broadcastFeaturePlaybackControl();
        global.timer._broadcastFeatureInfo();
      });

      socket.on('get-playstate', () => {
        socket.emit('playstate', global.timer.state);
      });

      socket.on('get-onAir', () => {
        socket.emit('onAir', global.timer.onAir);
      });

      /*******************************************/
      // selection data
      socket.on('get-selected', () => {
        socket.emit('selected', {
          id: global.timer.selectedEventId,
          index: global.timer.selectedEventIndex,
          total: global.timer._eventlist.length,
        });
      });

      socket.on('get-selected-id', () => {
        socket.emit('selected-id', global.timer.selectedEventId);
      });

      socket.on('get-next-id', () => {
        socket.emit('next-id', global.timer.nextEventId);
      });

      // title data
      socket.on('get-titles', () => {
        socket.emit('titles', global.timer.titles);
      });

      socket.on('get-publictitles', () => {
        socket.emit('publictitles', global.timer.titlesPublic);
      });

      /***********************************/
      /***  MESSAGE GETTERS / SETTERS  ***/
      /***  -------------------------  ***/
      /***********************************/

      /*******************************************/

      // Presenter message
      socket.on('set-timer-message-text', (data) => {
        global.timer._setTitles('set-timer-text', data);
        global.timer._broadcastFeatureMessageControl();
      });

      socket.on('set-timer-message-visible', (data) => {
        global.timer._setTitles('set-timer-visible', data);
        global.timer._broadcastFeatureMessageControl();
      });

      /*******************************************/
      // Public message
      socket.on('set-public-message-text', (data) => {
        global.timer._setTitles('set-public-text', data);
        global.timer._broadcastFeatureMessageControl();
      });

      socket.on('set-public-message-visible', (data) => {
        global.timer._setTitles('set-public-visible', data);
        global.timer._broadcastFeatureMessageControl();
      });

      /*******************************************/
      // Lower third message
      socket.on('set-lower-message-text', (data) => {
        global.timer._setTitles('set-lower-text', data);
        global.timer._broadcastFeatureMessageControl();
      });

      socket.on('set-lower-message-visible', (data) => {
        global.timer._setTitles('set-lower-visible', data);
        global.timer._broadcastFeatureMessageControl();
      });

      /* MOLECULAR ENDPOINTS
       * =====================
       * 1. EVENT LIST
       * 2. MESSAGE CONTROL
       * 3. PLAYBACK CONTROL
       * 4. INFO
       * 5. CUE SHEET
       * 6. TIMER OBJECT
       * */

      // 1. EVENT LIST
      socket.on('get-ontime-feat-eventlist', () => {
        global.timer._broadcastFeatureEventList();
      });

      // 2. MESSAGE CONTROL
      socket.on('get-ontime-feat-messagecontrol', () => {
        global.timer._broadcastFeatureMessageControl();
      });

      // 3. PLAYBACK CONTROL
      socket.on('get-ontime-feat-playbackcontrol', () => {
        global.timer._broadcastFeaturePlaybackControl();
      });

      // 4. INFO
      socket.on('get-ontime-feat-info', () => {
        global.timer._broadcastFeatureInfo();
      });

      // 5. CUE SHEET
      socket.on('get-ontime-feat-cuesheet', () => {
        global.timer._broadcastFeatureCuesheet();
      });

      // 6. TIMER
      socket.on('get-ontime-timer', () => {
        global.timer._broadcastFeatureTimer();
      });
    });
  }

  send(topic, payload) {
    this.socket.emit(topic, payload);
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
    const logMessage = {
      id: generateId(),
      level,
      origin,
      text,
      time: stringFromMillis(Timer.getCurrentTime() || 0),
    };

    this.messageStack.unshift(logMessage);
    this.socket.emit('logger', logMessage);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${logMessage.level}] \t ${logMessage.origin} \t ${logMessage.text}`);
    }

    if (this.messageStack.length > this._MAX_MESSAGES) {
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
}
