export const defaultDemoHtml = `<!doctype html>
<html lang="en">
  <head>
    <!-- For detailed explanations and examples, refer to the README.md file in this directory -->
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>ontime demo</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        max-width: 100vw;
        overflow-x: hidden;
        font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        background: #f6f6f6;
        color: #222;
      }

      .container {
        display: flex;
        flex-direction: row;
        gap: 12px;
        padding: 10px 12px;
      }

      .container .column {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .title-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        background: #eaeaea;
      }

      .logo-title {
        display: flex;
        align-items: center;
        gap: 7px;
      }

      .logo-title img {
        width: 28px;
        height: 28px;
        object-fit: contain;
      }

      .card {
        padding: 10px 12px;
        background: #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
      }

      .card summary.title {
        border-bottom: 1px solid #ccc;
        padding-bottom: 2px;
        margin-bottom: 2px;
      }

      h1.title,
      summary.title {
        font-size: 0.95em;
        font-weight: 600;
        margin: 0;
        user-select: none;
      }

      summary.title {
        cursor: pointer;
      }

      code {
        font-size: 0.75em;
        font-family: monospace;
        background: #f4f4f4;
        border-radius: 4px;
        padding: 1.5px 3px;
        display: inline-block;
        white-space: pre;
        width: 100%;
      }

      figure {
        margin: 0;
        padding: 0;
      }

      figcaption.description {
        color: #555;
        font-size: 0.75em;
        font-style: italic;
      }
    </style>
  </head>

  <body>
    <header class="title-card">
      <div class="logo-title">
        <img
          src="https://www.getontime.no/images/icons/ontime-logo.png"
          alt="Ontime logo"
          onerror="this.style.display = 'none'"
        />
        <h1 class="title">Ontime demo</h1>
      </div>
      <div>
        <span>Last message received at</span>
        <span id="clock">-</span>
      </div>
      <nav>
        <a href="https://docs.getontime.no/api/data/runtime-data" target="_blank">Help? See docs</a>
      </nav>
    </header>

    <main class="container">
      <section class="column">
        <details class="card" open>
          <summary class="title">Timer</summary>
          <figure>
            <figcaption class="description">Current timer values</figcaption>
            <code id="timer">-</code>
          </figure>
        </details>
        <details class="card" open>
          <summary class="title">Rundown</summary>
          <figure>
            <figcaption class="description">Progress of the current rundown</figcaption>
            <code id="rundown">-</code>
          </figure>
        </details>
        <details class="card" open>
          <summary class="title">Offset</summary>
          <figure>
            <figcaption class="description">Runtime offset and timings for upcoming targets</figcaption>
            <code id="offset">-</code>
          </figure>
        </details>
      </section>
      <section class="column">
        <details class="card" open>
          <summary class="title">Event now</summary>
          <figure>
            <figcaption class="description">Currently loaded event</figcaption>
            <code id="eventNow">-</code>
          </figure>
        </details>
        <details class="card" open>
          <summary class="title">Event next</summary>
          <figure>
            <figcaption class="description">Next scheduled event</figcaption>
            <code id="eventNext">-</code>
          </figure>
        </details>
      </section>
      <section class="column">
        <details class="card" open>
          <summary class="title">Group now</summary>
          <figure>
            <figcaption class="description">Currently active group</figcaption>
            <code id="groupNow">-</code>
          </figure>
        </details>
        <details class="card" open>
          <summary class="title">Event flag</summary>
          <figure>
            <figcaption class="description">Currently targeted flag</figcaption>
            <code id="eventFlag">-</code>
          </figure>
        </details>
      </section>
      <section class="column">
        <details class="card" open>
          <summary class="title">Message</summary>
          <figure>
            <figcaption class="description">Messaging feature</figcaption>
            <code id="message">-</code>
          </figure>
        </details>
        <details class="card" open>
          <summary class="title">Aux timers</summary>
          <figure>
            <figcaption class="description">Auxiliary Timer 1</figcaption>
            <code id="auxtimer1">-</code>
          </figure>
          <figure>
            <figcaption class="description">Auxiliary Timer 2</figcaption>
            <code id="auxtimer2">-</code>
          </figure>
          <figure>
            <figcaption class="description">Auxiliary Timer 3</figcaption>
            <code id="auxtimer3">-</code>
          </figure>
        </details>
      </section>
    </main>

    <script>
      const isSecure = window.location.protocol === 'https:';
      const userProvidedSocketUrl = \`\${isSecure ? 'wss' : 'ws'}://\${window.location.host}\${getStageHash()}/ws\`;

      connectSocket();

      let reconnectTimeout;
      const reconnectInterval = 1000;
      let reconnectAttempts = 0;

      function connectSocket(socketUrl = userProvidedSocketUrl) {
        const websocket = new WebSocket(socketUrl);

        websocket.onopen = () => {
          clearTimeout(reconnectTimeout);
          reconnectAttempts = 0;
          console.warn('WebSocket connected');
        };

        websocket.onclose = () => {
          console.warn('WebSocket disconnected');
          reconnectTimeout = setTimeout(() => {
            console.warn(\`WebSocket: attempting reconnect \${reconnectAttempts}\`);
            if (websocket && websocket.readyState === WebSocket.CLOSED) {
              reconnectAttempts += 1;
              connectSocket();
            }
          }, reconnectInterval);
        };
        websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        websocket.onmessage = (event) => {
          const { tag, payload } = JSON.parse(event.data);
          if (tag === 'runtime-data') {
            handleOntimePayload(payload);
          }
        };
      }

      let localData = {};
      function handleOntimePayload(payload) {
        localData = { ...localData, ...payload };

        if ('clock' in payload) updateDOM('clock', formatTimer(payload.clock));
        if ('timer' in payload) updateDOM('timer', formatObject(payload.timer));
        if ('rundown' in payload) updateDOM('rundown', formatObject(payload.rundown));
        if ('offset' in payload) updateDOM('offset', formatObject(payload.offset));
        if ('eventNow' in payload) updateDOM('eventNow', formatObject(payload.eventNow));
        if ('eventNext' in payload) updateDOM('eventNext', formatObject(payload.eventNext));
        if ('eventFlag' in payload) updateDOM('eventFlag', formatObject(payload.eventFlag));
        if ('groupNow' in payload) updateDOM('groupNow', formatObject(payload.groupNow));
        if ('message' in payload) updateDOM('message', formatObject(payload.message));
        if ('auxtimer1' in payload) updateDOM('auxtimer1', formatObject(payload.auxtimer1));
        if ('auxtimer2' in payload) updateDOM('auxtimer2', formatObject(payload.auxtimer2));
        if ('auxtimer3' in payload) updateDOM('auxtimer3', formatObject(payload.auxtimer3));
      }

      function updateDOM(field, payload) {
        const domElement = document.getElementById(field);
        if (domElement) {
          domElement.innerText = payload;
        }
      }

      const millisToSeconds = 1000;
      const millisToMinutes = 1000 * 60;
      const millisToHours = 1000 * 60 * 60;

      function formatTimer(number) {
        if (number == null) {
          return '--:--:--';
        }
        const millis = Math.abs(number);
        const isNegative = number < 0;
        return \`\${isNegative ? '-' : ''}\${leftPad(millis / millisToHours)}:\${leftPad(
          (millis % millisToHours) / millisToMinutes,
        )}:\${leftPad((millis % millisToMinutes) / millisToSeconds)}\`;

        function leftPad(val) {
          return Math.floor(val).toString().padStart(2, '0');
        }
      }

      function formatObject(data) {
        return JSON.stringify(data, null, 2);
      }

      function getStageHash() {
        const href = window.location.href;
        if (!href.includes('getontime.no')) {
          return '';
        }
        const hash = href.split('/');
        const stageHash = hash.at(3);
        return stageHash ? \`/\${stageHash}\` : '';
      }
    </script>
  </body>
</html>`;
