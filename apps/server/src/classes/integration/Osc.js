import { Client, Message } from 'node-osc';

/**
 * @description Class contains logic towards outgoing OSC communications
 * @class
 */
export class OSCIntegration {
  constructor() {
    // OSC Client
    this.ADDRESS = '/ontime';
    this.oscClient = null;
  }

  /**
   * @description Returns list of implemented messages
   * @returns {object} implemented messages
   */
  get implemented() {
    return {
      play: 'play',
      pause: 'pause',
      stop: 'stop',
      previous: 'prev',
      next: 'next',
      reload: 'reload',
      finished: 'finished',
      time: 'time',
      overtime: 'overtime',
      title: 'title',
      eventNumber: 'eventNumber',
      presenter: 'presenter',
    };
  }

  /**
   * @description Initializes oscClient
   * @param {object} oscConfig - oscClient configuration options
   * @param {string} oscConfig.ip - oscClient object
   * @param {number} oscConfig.port - OSC Destination Port
   */
  init(oscConfig) {
    const { ip, port } = oscConfig;
    const validateType = typeof ip !== 'string' || typeof port !== 'number';
    const validateNull = ip == null || port == null;

    if (validateType || validateNull) {
      return {
        success: false,
        message: `Config options incorrect`,
      };
    }
    try {
      this.oscClient = new Client(ip, port);
      return {
        success: true,
        message: `Initialised OSC Client at ${ip}:${port}`,
      };
    } catch (error) {
      this.oscClient = null;
      return {
        success: false,
        message: `Failed initialising OSC Client: ${error}`,
      };
    }
  }

  /**
   * @description Sends osc  from predefined messages
   * @param {string} messageType - message to be sent
   * @param {string} [payload] - optional payload required in some message types
   */
  async send(messageType, payload) {
    const reply = {
      success: true,
      message: 'OSC Message sent',
    };

    if (this.oscClient == null) {
      reply.success = false;
      reply.message = 'Client not initialised';
      return reply;
    }

    if (messageType == null) {
      reply.success = false;
      reply.message = 'Message undefined';
      return reply;
    }

    // only specify special cases
    switch (payload) {
      case 'overtime': {
        // Whether timer is negative
        this.oscClient.send(`${this.ADDRESS}/overtime`, payload, (err) => {
          if (err) {
            reply.success = false;
            reply.message = err;
          }
        });
        break;
      }
      case 'title': {
        if (payload != null && payload !== '') {
          // Send Title of current event
          this.oscClient.send(`${this.ADDRESS}/title`, payload, (err) => {
            if (err) {
              reply.success = false;
              reply.message = err;
            }
          });
        } else {
          reply.success = false;
          reply.message = 'Missing message data';
        }
        break;
      }
      case 'eventNumber': {
        if (payload != null && payload !== '') {
          // Send event number of current event
          this.oscClient.send(`${this.ADDRESS}/eventNumber`, payload, (err) => {
            if (err) {
              reply.success = false;
              reply.message = err;
            }
          });
        } else {
          reply.success = false;
          reply.message = 'Missing message data';
        }
        break;
      }
      case 'presenter': {
        if (payload != null && payload !== '') {
          // Send timer data on current event
          this.oscClient.send(`${this.ADDRESS}/presenter`, payload, (err) => {
            if (err) {
              reply.success = false;
              reply.message = err;
            }
          });
        } else {
          reply.success = false;
          reply.message = 'Missing message data';
        }
        break;
      }
      default: {
        // catch all for messages, allows to add new messages
        // but should be used with the integrations definition
        const message = new Message(`${this.ADDRESS}/${messageType}`);
        if (payload != null) message.append(payload);
        this.oscClient.send(message, (err) => {
          if (err) {
            reply.success = false;
            reply.message = err;
          }
        });
        break;
      }
    }
    return reply;
  }

  shutdown() {
    // Shutdown client object
    this.oscClient.close();
    this.oscClient = null;
  }
}
