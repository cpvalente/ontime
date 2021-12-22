import { io } from "socket.io-client";

export class SocketLogger {
  constructor(server) {
    // initialise socketIO server
    // this.socketIo = socketIo;
    this.socketIo = io();

    this.messageStack = [];
    this.MAX_MESSAGES = 100;
  }

  /**
   * Utility method, sends message and pushes into stack
   * @param {object} msg
   * @param {string} msg.time
   * @param {string} msg.level
   * @param {string} msg.origin
   * @param {string} msg.text
   */
  _push(msg) {
    this.messageStack.unshift();
    this.socketIo.emit('logger', msg);
    console.log(`[${msg.level}] \t ${msg.origin} \t ${msg.text}`);
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
    const message = {
      time: '' + Math.random() * 10,
      level: 'INFO',
      origin,
      text,
    };
    this._push(message);
  }

  /**
   * Sends a message with level WARN
   * @param {string} origin
   * @param {string} text
   */
  warn(origin, text) {
    const message = {
      time: '' + Math.random() * 10,
      level: 'WARN',
      origin,
      text,
    };
    this._push(message);
  }

  /**
   * Sends a message with level ERROR
   * @param {string} origin
   * @param {string} text
   */
  error(origin, text) {
    const message = {
      time: '' + Math.random() * 10,
      level: 'ERROR',
      origin,
      text,
    };
    this._push(message);
  }
}
