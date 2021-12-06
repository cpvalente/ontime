/** Class contains logic towards outgoing HTTP communications. */
import * as http from 'http';

export class HTTPIntegration {

  constructor() {
    // nothing to do here
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
   * @param {object} httpConfig - oscClient object
   */
  init(httpConfig) {

  }

  /**
   * @description Sends http get request from predefined messages
   * @param {string} path - complete http path
   */
  async send(path) {
    if (path == null) {
      console.log('HTTP ERROR: Message undefined');
      return;
    }

    const options = new URL(path);
    let str = '';

    const req = http.request(options, res => {
      console.log(`statusCode: ${res.statusCode}`)

      res.on('data', function (chunk) {
        str += chunk;
      });

      res.on('end', function () {
        console.log(str);
      });
    })

    req.on('error', error => {
      console.error(error)
    })

    req.end()
  }

  shutdown() { /* Nothing to shutdown */  }
}