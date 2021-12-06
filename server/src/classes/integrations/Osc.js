/** Class contains logic towards outgoing OSC communications. */
import {Client, Message} from 'node-osc';

export class OSCIntegration {

  ADDRESS = '/ontime';

  constructor() {
    // OSC Client
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
      presenter:'presenter',
    }
  }

  /**
   * @description Initializes oscClient
   * @param {object} oscConfig - oscClient configuration options
   * @param {string} oscConfig.ip - oscClient object
   * @param {number} oscConfig.port - OSC Destination Port
   */
  init(oscConfig) {
    const {ip, port} = oscConfig;
    try {
      this.oscClient = new Client(ip, port);
      console.log(`Initialised OSC Client at ${ip}:${port}`);
    } catch (error) {
      this.oscClient = null;
      console.log(`Failed initialising OSC Client: ${error}`);
    }
  }

  /**
   * @description Sends osc  from predefined messages
   * @param {string} messageType - message to be sent
   * @param {string} [payload] - optional payload required in some message types
   */
  async send(messageType, payload) {
    if (this.oscClient == null) {
      console.log('OSC ERROR: Client not initialised');
      return;
    }

    if (messageType == null) {
      console.log('OSC ERROR: Message undefined');
      return;
    }

    // only specify special cases
    switch (payload) {
      case 'overtime':
        // Whether timer is negative
        this.oscClient.send(`${this.ADDRESS}/overtime`, payload, (err) => {
          if (err) console.error(err);
        });
        break;
      case 'title':
        if (payload != null && payload !== "") {
          // Send Title of current event
          this.oscClient.send(`${this.ADDRESS}/title`, payload, (err) => {
            if (err) console.error(err);
          });
        }
        break;
      case 'presenter':
        if (payload != null && payload !== "") {
          // Send presenter data on current event
          this.oscClient.send(`${this.ADDRESS}/presenter`, payload, (err) => {
            if (err) console.error(err);
          });
        }
        break;
      default:
        // catch all for messages, allows to add new messages
        // but should be used with the integrations definition
        const message = new Message(`${this.ADDRESS}/${messageType}`)
        if (payload != null) message.append(payload)
        this.oscClient.send(message, (err) => {
          if (err) console.error(err);
        });
        break;
    }
  }

  shutdown() {
    // Shutdown client object
    this.oscClient.close();
    this.oscClient = null;
  }
}