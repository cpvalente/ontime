import { Server } from 'socket.io';
import { generateId } from 'ontime-utils';

import getRandomName from '../../utils/getRandomName.js';
import { stringFromMillis } from '../../utils/time.js';
import { messageService } from '../../services/message-service/MessageService.js';
import { PlaybackService } from '../../services/PlaybackService.js';

import { eventTimer } from '../../services/TimerService.js';
import { clock } from '../../services/Clock.js';
import { eventStore } from '../../stores/EventStore.js';
import { isProduction } from '../../setup.js';

class SocketController {
  constructor() {
    this.numClients = 0;
    this.messageStack = [];
    this._MAX_MESSAGES = 100;
    this._clientNames = {};
    this.socket = null;
  }

  initServer(httpServer) {
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
      const message = `${this.numClients} Clients with new connection: ${this._clientNames[socket.id]}`;
      this.info('CLIENT', message);

      /**
       * @description handle disconnecting a user
       */
      socket.on('disconnect', () => {
        this.numClients--;
        const message = `${this.numClients} Clients with disconnection: ${this._clientNames[socket.id]}`;
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
        PlaybackService.start();
      });

      socket.on('set-startid', (data) => {
        if (data) {
          PlaybackService.startById(data);
        }
      });

      socket.on('set-startindex', (data) => {
        const eventIndex = Number(data);
        if (!isNaN(eventIndex)) {
          PlaybackService.startByIndex(eventIndex);
        }
      });

      socket.on('set-loadid', (data) => {
        if (data) {
          PlaybackService.loadById(data);
        }
      });

      socket.on('set-loadindex', (data) => {
        const eventIndex = Number(data);
        if (!isNaN(eventIndex)) {
          PlaybackService.loadByIndex(eventIndex - 1);
        }
      });

      socket.on('set-pause', () => {
        PlaybackService.pause();
      });

      socket.on('set-stop', () => {
        PlaybackService.stop();
      });

      socket.on('set-reload', () => {
        PlaybackService.reload();
      });

      socket.on('set-previous', () => {
        PlaybackService.loadPrevious();
      });

      socket.on('set-next', () => {
        PlaybackService.loadNext();
      });

      socket.on('set-roll', () => {
        PlaybackService.roll();
      });

      socket.on('set-delay', (data) => {
        const delayTime = Number(data);
        if (!isNaN(delayTime)) {
          PlaybackService.setDelay(delayTime);
        }
      });

      /*******************************************/
      // general playback state, useful for external sync
      // Todo: add delayed value (will come from rundownService)
      socket.on('ontime-poll', () => {
        const timerPoll = eventTimer.timer;
        const isDelayed = false;
        const colour = '';
        socket.emit('ontime-poll', { isDelayed, colour, ...timerPoll });
      });

      // On Air
      socket.on('set-onAir', (data) => {
        if (typeof data === 'boolean') {
          try {
            const featureData = messageService.setOnAir(data);
            this.info('PLAYBACK', featureData.onAir ? 'Going On Air' : 'Going Off Air');
          } catch (error) {
            this.error('RX', `Failed to parse message ${data} : ${error}`);
          }
        }
      });

      // Presenter message
      socket.on('set-timer-message-text', (data) => {
        if (typeof data !== 'string') {
          return;
        }
        messageService.setTimerText(data);
      });

      socket.on('set-timer-message-visible', (data) => {
        if (typeof data !== 'boolean') {
          return;
        }
        messageService.setTimerVisibility(data);
      });

      /*******************************************/
      // Public message
      socket.on('set-public-message-text', (data) => {
        if (typeof data !== 'string') {
          return;
        }
        messageService.setPublicText(data);
      });

      socket.on('set-public-message-visible', (data) => {
        if (typeof data !== 'boolean') {
          return;
        }
        messageService.setPublicVisibility(data);
      });

      /*******************************************/
      // Lower third message
      socket.on('set-lower-message-text', (data) => {
        if (typeof data !== 'string') {
          return;
        }
        messageService.setLowerText(data);
      });

      socket.on('set-lower-message-visible', (data) => {
        if (typeof data !== 'boolean') {
          return;
        }
        messageService.setLowerVisibility(data);
      });

      socket.on('get-timer', () => {
        const timer = eventStore.get('timer');
        socket.emit('timer', timer);
      });
    });
  }

  send(topic, payload) {
    this.socket?.emit(topic, payload);
  }

  /****************************************************************************/

  /**
   * Logger logic
   * -------------
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
      time: stringFromMillis(clock.getSystemTime() || 0),
    };

    this.messageStack.unshift(logMessage);
    this.socket?.emit('logger', logMessage);

    if (!isProduction) {
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

export const socketProvider = new SocketController();
