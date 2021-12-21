export class SocketLogger {
  constructor(socketIo) {
    // initialise socketIO server
    this.socketIo = socketIo;
    this.messsageStack = [];
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
    this.messsageStack.unshift();
    this.socketIo.emit('logger', msg);
    console.log(`[${msg.level}] ${msg.origin}: ${msg.text}`);
    if (this.messsageStack.length > 100) {
      this.messsageStack.pop();
    }
  }

  /**
   * Sends a message with level LOG
   * @param {string} origin
   * @param {string} text
   */
  info(origin, text) {
    const message = {
      time: '10:32:12',
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
      time: '10:32:12',
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
      time: '10:32:12',
      level: 'ERROR',
      origin,
      text,
    };
    this._push(message);
  }
}
