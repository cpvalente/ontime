import { Server } from 'socket.io';

import getRandomName from '../../utils/getRandomName.js';
import { generateId } from '../../utils/generate_id.js';
import { stringFromMillis } from '../../utils/time.js';
import { Timer } from '../timer/Timer.js';
import { messageManager } from '../message-manager/MessageManager.js';
import { PlaybackService } from '../../services/playbackService.js';

import { ADDRESS_MESSAGE_CONTROL } from './socketConfig.js';
import { eventTimer } from '../../services/TimerService.js';
import { EventLoader, eventLoader } from '../event-loader/EventLoader.js';

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
      const message = `${this.numClients} Clients with new connection: ${
        this._clientNames[socket.id]
      }`;
      this.info('CLIENT', message);

      // Todo: review in favour of features
      // send state
      socket.emit('timer', eventTimer.timer);
      socket.emit('playback', eventTimer.playback);
      socket.emit('selected', {
        id: eventLoader.selectedEventId,
        index: eventLoader.selectedEventIndex,
        total: eventLoader.numEvents,
      });
      socket.emit('next-id', eventLoader.nextEventId);
      socket.emit('publicselected-id', eventLoader.selectedPublicEventId);
      socket.emit('publicnext-id', eventLoader.nextPublicEventId);

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

      /*******************************************/
      socket.on('get-playback', () => {
        socket.emit('playback', eventTimer.playback);
      });

      socket.on('get-onAir', () => {
        socket.emit('onAir', messageManager.onAir);
      });

      /*******************************************/
      socket.on('get-selected', () => {
        socket.emit('selected', {
          id: eventLoader.selectedEventId,
          index: eventLoader.selectedEventIndex,
          total: eventLoader.numEvents,
        });
      });

      socket.on('get-titles', () => {
        socket.emit('titles', eventLoader.titles);
      });

      socket.on('get-publictitles', () => {
        socket.emit('publictitles', eventLoader.titlesPublic);
      });

      /***********************************/
      /***  MESSAGE GETTERS / SETTERS  ***/
      /***  -------------------------  ***/
      /***********************************/

      // On Air
      socket.on('set-onAir', (data) => {
        if (typeof data === 'boolean') {
          try {
            const featureData = messageManager.setOnAir(data);
            this.info('PLAYBACK', featureData.onAir ? 'Going On Air' : 'Going Off Air');
            this.socket.emit(ADDRESS_MESSAGE_CONTROL, featureData);
          } catch (error) {
            this.error('RX', `Failed to parse message ${data} : ${error}`);
          }
        }
        this.send('onAir', messageManager.onAir);
      });

      // Presenter message
      socket.on('set-timer-message-text', (data) => {
        if (typeof data !== 'string') {
          return;
        }
        const featureData = messageManager.setTimerText(data);
        this.socket.emit(ADDRESS_MESSAGE_CONTROL, featureData);
      });

      socket.on('set-timer-message-visible', (data) => {
        if (typeof data !== 'boolean') {
          return;
        }
        const featureData = messageManager.setTimerVisibility(data);
        this.socket.emit(ADDRESS_MESSAGE_CONTROL, featureData);
      });

      /*******************************************/
      // Public message
      socket.on('set-public-message-text', (data) => {
        if (typeof data !== 'string') {
          return;
        }
        const featureData = messageManager.setPublicText(data);
        this.socket.emit(ADDRESS_MESSAGE_CONTROL, featureData);
      });

      socket.on('set-public-message-visible', (data) => {
        if (typeof data !== 'boolean') {
          return;
        }
        const featureData = messageManager.setPublicVisibility(data);
        this.socket.emit(ADDRESS_MESSAGE_CONTROL, featureData);
      });

      /*******************************************/
      // Lower third message
      socket.on('set-lower-message-text', (data) => {
        if (typeof data !== 'string') {
          return;
        }
        const featureData = messageManager.setLowerText(data);
        this.socket.emit(ADDRESS_MESSAGE_CONTROL, featureData);
      });

      socket.on('set-lower-message-visible', (data) => {
        if (typeof data !== 'boolean') {
          return;
        }
        const featureData = messageManager.setLowerVisibility(data);
        this.socket.emit(ADDRESS_MESSAGE_CONTROL, featureData);
      });

      /* MOLECULAR ENDPOINTS
       * =====================
       * 1. RUNDOWN
       * 2. MESSAGE CONTROL
       * 3. PLAYBACK CONTROL
       * 4. INFO
       * 5. CUE SHEET
       * 6. TIMER OBJECT
       * */

      // 1. RUNDOWN
      socket.on('get-feat-rundown', () => {
        this.broadcastFeatureRundown();
      });

      // 2. MESSAGE CONTROL
      socket.on('get-feat-messagecontrol', () => {
        this.broadcastFeatureMessageControl();
      });

      // 3. PLAYBACK CONTROL
      socket.on('get-feat-playbackcontrol', () => {
        this.broadcastFeaturePlaybackControl();
      });

      // 4. INFO
      socket.on('get-feat-info', () => {
        this.broadcastFeatureInfo();
      });

      // 5. CUE SHEET
      socket.on('get-feat-cuesheet', () => {
        this.broadcastFeatureCuesheet();
      });

      // 6. TIMER
      socket.on('get-ontime-timer', () => {
        this.broadcastTimer();
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
   * Broadcast data for Event List feature
   */
  broadcastFeatureRundown() {
    const featureData = {
      selectedEventId: eventLoader.selectedEventId,
      nextEventId: eventLoader.nextEventId,
      playback: eventTimer.playback,
    };
    this.send('feat-rundown', featureData);
  }

  /**
   * Broadcast data for Message Control feature
   */
  broadcastFeatureMessageControl() {
    const featureData = messageManager.getAll();
    this.send(ADDRESS_MESSAGE_CONTROL, featureData);
  }

  /**
   * Broadcast data for Playback Control feature
   */
  broadcastFeaturePlaybackControl() {
    const featureData = {
      playback: eventTimer.playback,
      selectedEventId: eventLoader.selectedEventId,
      numEvents: EventLoader.getNumEvents(),
    };
    this.send('feat-playbackcontrol', featureData);
  }

  /**
   * Broadcast data for Info feature
   */
  broadcastFeatureInfo() {
    const featureData = {
      titles: eventLoader.titles,
      playback: eventTimer.playback,
      selectedEventId: eventLoader.selectedEventId,
      selectedEventIndex: eventLoader.selectedEventIndex,
      numEvents: EventLoader.getNumEvents(),
    };
    this.send('feat-info', featureData);
  }

  /**
   * Broadcast data for Cuesheet feature
   */
  broadcastFeatureCuesheet() {
    const featureData = {
      playback: eventTimer.playback,
      selectedEventId: eventLoader.selectedEventId,
      selectedEventIndex: eventLoader.selectedEventIndex,
      numEvents: EventLoader.getNumEvents(),
      titleNow: eventLoader.titles.titleNow,
    };
    this.send('feat-cuesheet', featureData);
  }

  /**
   * Broadcast Timer feature
   */
  broadcastTimer() {
    const featureData = eventTimer.timer;
    this.send('ontime-timer', featureData);
  }

  broadcastState() {
    this.broadcastFeatureRundown();
    this.broadcastFeatureMessageControl();
    this.broadcastFeaturePlaybackControl();
    this.broadcastFeatureInfo();
    this.broadcastFeatureCuesheet();
    this.broadcastTimer();
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
