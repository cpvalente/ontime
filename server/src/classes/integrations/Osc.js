/** Class contains logic towards outgoing OSC communications. */
export class OSCIntegration {

  ADDRESS = '/ontime';

  /**
   * Create a class instance
   * @param {number} x - The x value.
   * @param {number} y - The y value.
   * @param {number} width - The width of the dot, in pixels.
   */
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
   * @param {object} oscClient
   */
  init(oscClient) {
    this.oscClient = oscClient;
  }

  /**
   * @description Sends osc  from predefined messages
   * @param {string} messageType - message to be sent
   * @param {string} [payload] - optional payload required in some message types
   */
  send(messageType, payload) {
    if (this.oscClient == null) {
      console.log('OSC ERROR: Client not initialised');
      return;
    }

    if (messageType == null) {
      console.log('OSC ERROR: Message undefinde');
      return;
    }

    console.log('sending osc', messageType, payload)

    // only specify special cases
    switch (payload) {
      case 'overtime':
        // Whether timer is negative
        this.oscClient.send(this.ADDRESS + '/overtime', payload, (err) => {
          if (err) console.error(err);
        });
        break;
      case 'title':
        // Send Title of current event
        this.oscClient.send(this.ADDRESS + '/title', payload, (err) => {
          if (err) console.error(err);
        });
        break;
      case 'presenter':
        // Send presenter data on current event
        this.oscClient.send(this.ADDRESS + '/presenter', payload, (err) => {
          if (err) console.error(err);
        });
        break;

      default:
        // catch all for messages, allows to add new messages
        // but should be used with the integrations definition
        this.oscClient.send(this.ADDRESS, messageType, (err) => {
          if (err) console.error(err);
        });
        break;
    }
  }

  shutdown() {
    // Shutdown client object
    this.oscClient.close();
  }
}