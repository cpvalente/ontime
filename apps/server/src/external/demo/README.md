## Demo

This is a demo application which demonstrates how to create a custom view leveraging a websocket client to get data from Ontime.

Here, we subscribe to the websocket and display all the data received in a grid.

Please note this demo tries to be simple and clear. You would likely want to implement a more robust solution in a production environment.

### Getting the data

To subscribe to the websocket you will need:

- The address of the Ontime server (including the IP): eg, `cloud.getontime.no/stage-hash` or `192.168.1.1:4001`
- If the stage is password protected, you will also need to provide a token to access the data. You can get this token by generating a share link for Companion (Editor > Settings > Share link) and ensuring the "Authenticate Link" option is on.

#### Example

- Ontime URL: `https://cloud.getontime.no/stage-123`
- Ontime token: `token-from-share`

```js
// use wss since we are connecting to an https address
const socketUrl = `wss://cloud.getontime.no/stage-123/ws?token=token-from-share`;

/**
 * Connects to the websocket server
 * NOTE: this demo does not handle reconnections or errors
 * @param {string} socketUrl
 */
const connectSocket = (socketUrl) => {
  const websocket = new WebSocket(socketUrl);

  websocket.onmessage = (event) => {
    // all objects from ontime are structured with tag and payload
    const { tag, payload } = JSON.parse(event.data);

    // runtime-data is sent on connect, with the full state
    // runtime-patch is sent on every change to the state
    if (tag === 'runtime-data') {
      handleOntimePayload(payload);
    }
  };
};
```

### Runtime data

`runtime-data` contains a patch of all the data in the server
you would need to create a function that parses the patch and extract the data you need

In our case, we simply map the data to a DOM element with the same ID as the field name.

[See the docs](https://docs.getontime.no/api/data/runtime-data/).

#### Example of handling the payload

```js
const handleOntimePayload = (payload) => {
  // 1. apply the patch into your local copy of the data
  localData = { ...localData, ...payload };

  // 2. update the UI with the new data
  // ... timer data
  if ('clock' in payload) updateDOM('clock', formatTimer(payload.clock));
  if ('timer' in payload) updateDOM('timer', formatObject(payload.timer));
  // ... rundown data
  if ('rundown' in payload) updateDOM('rundown', formatObject(payload.rundown));
  // ... runtime
  if ('offset' in payload) updateDOM('offset', formatObject(payload.offset));
  // ... relevant entries
  if ('eventNow' in payload) updateDOM('eventNow', formatObject(payload.eventNow));
  if ('eventNext' in payload) updateDOM('eventNext', formatObject(payload.eventNext));
  if ('eventFlag' in payload) updateDOM('eventFlag', formatObject(payload.eventFlag));
  if ('groupNow' in payload) updateDOM('groupNow', formatObject(payload.groupNow));
  // ... messages service
  if ('message' in payload) updateDOM('message', formatObject(payload.message));
  // ... extra timers
  if ('auxtimer1' in payload) updateDOM('auxtimer1', formatObject(payload.auxtimer1));
  if ('auxtimer2' in payload) updateDOM('auxtimer2', formatObject(payload.auxtimer2));
  if ('auxtimer3' in payload) updateDOM('auxtimer3', formatObject(payload.auxtimer3));
};
```

#### Payload example

See below what the payload looks like.
Note: all timer values are in milliseconds.

```jsonc
{
  /** Current server clock value */
  "clock": 37816011,

  /**
   * Gathers the current running timer state
   */
  "timer": {
    /** Additional time added to the running timer, can be negative */
    "addedTime": 0,
    /** Current running timer countdown */
    "current": 3574976,
    /** Total duration of the running event */
    "duration": 3600000,
    /** Time elapsed since the timer started */
    "elapsed": 25024,
    /** Timestamp of the expected finish time */
    "expectedFinish": 41391285,
    /** Current phase of the running event */
    "phase": "default",
    /** Timer's playback state */
    "playback": "play",
    /** Secondary timer, used to count to an event start in roll mode */
    "secondaryTimer": null,
    /** Timestamp when the timer started */
    "startedAt": 37791285,
  },

  /**
   * Offset represents our current position in relation to the planned time
   * a positive value means that we have added extra time to the expected end
   * aka behind schedule
   */
  "offset": {
    /** Current absolute offset: accounts for planned times */
    "absolute": 40394840,
    /** Current relative offset: only counts for generated offset since start */
    "relative": -35997119,
    /** Currently selected offset mode */
    "mode": "absolute",
    /** Timestamp of the expected start of the next flag */
    "expectedFlagStart": 80594840,
    /** Timestamp of the expected end of the current group */
    "expectedGroupEnd": 83594840,
    /** Timestamp of the expected end of the loaded rundown */
    "expectedRundownEnd": 90794840,
  },

  /** Data object describes rundown schedule and the current progress */
  "rundown": {
    /** Index of the currently selected event */
    "selectedEventIndex": 1,
    /** Total number of events */
    "numEvents": 7,
    /** Timestamp of the rundown's planned start time */
    "plannedStart": 0,
    /** Timestamp of the rundown's planned end time */
    "plannedEnd": 50400000,
    /** Timestamp of when the rundown was actually started */
    "actualStart": 76391959,
  },

  /** Data of currently loaded event */
  "eventNow": {
    /** Unique identifier for the event */
    "id": "9bf60f",
    /** Entry type */
    "type": "event",
    /** Whether the event is flagged */
    "flag": false,
    /** Title of the event */
    "title": "Pre-show Countdown",
    /** Timestamp of the planned start time */
    "timeStart": 36000000,
    /** Timestamp of the planned end time */
    "timeEnd": 39600000,
    /** Planned event duration */
    "duration": 3600000,
    /** Strategy for time management */
    "timeStrategy": "lock-end",
    /** Whether the event is linked to the start of the previous */
    "linkStart": false,
    /** Action to take at the end of the event */
    "endAction": "none",
    /** Type of timer used for the event */
    "timerType": "count-down",
    /** Whether the timer counts to the end */
    "countToEnd": false,
    /** Whether the event is skipped */
    "skip": false,
    /** Note associated with the event */
    "note": "Music plays, holding slide on screens",
    /** Colour code for the event */
    "colour": "#77C785",
    /** Current delay inherited from the rundown schedule */
    "delay": 0,
    /** Day offset for the event */
    "dayOffset": 0,
    /** Time gap between events */
    "gap": 0,
    /** Cue number for the event */
    "cue": "1",
    /** Parent group ID */
    "parent": "7eaf99",
    /** Revision number for the entry */
    "revision": 0,
    /** Warning time */
    "timeWarning": 600000,
    /** Danger time */
    "timeDanger": 300000,
    /** Custom fields for the event */
    "custom": { "Custom_Field": "Put additional info here" },
    /** Triggers associated with the event */
    "triggers": [],
  },

  /** Upcoming event data */
  "eventNext": {
    /** Unique identifier for the event */
    "id": "c2697f",
    /** Entry type */
    "type": "event",
    /** Whether the event is flagged */
    "flag": false,
    /** Title of the event */
    "title": "Welcome",
    /** Timestamp of the planned start time */
    "timeStart": 39600000,
    /** Timestamp of the planned end time */
    "timeEnd": 40200000,
    /** Planned event duration */
    "duration": 600000,
    /** Strategy for time management */
    "timeStrategy": "lock-duration",
    /** Whether the event is linked to the start of the previous */
    "linkStart": true,
    /** Action to take at the end of the event */
    "endAction": "none",
    /** Type of timer used for the event */
    "timerType": "count-down",
    /** Whether the timer counts to the end */
    "countToEnd": false,
    /** Whether the event is skipped */
    "skip": false,
    /** Note associated with the event */
    "note": "Emma Thompson",
    /** Colour code for the event */
    "colour": "#FFCC78",
    /** Current delay inherited from the rundown schedule */
    "delay": 0,
    /** Day offset for the event */
    "dayOffset": 0,
    /** Time gap between events */
    "gap": 0,
    /** Cue number for the event */
    "cue": "1.1",
    /** Parent group ID */
    "parent": "7eaf99",
    /** Revision number for the entry */
    "revision": 0,
    /** Warning time */
    "timeWarning": 120000,
    /** Danger time */
    "timeDanger": 60000,
    /** Custom fields for the event */
    "custom": {},
    /** Triggers associated with the event */
    "triggers": [],
  },

  /** Data of currently targetted flag event */
  "eventFlag": {
    /** Unique identifier for the event */
    "id": "fa593e",
    /** Entry type */
    "type": "event",
    /** Whether the event is flagged */
    "flag": true,
    /** Title of the event */
    "title": "Session 1",
    /** Timestamp of the planned start time */
    "timeStart": 40200000,
    /** Timestamp of the planned end time */
    "timeEnd": 43200000,
    /** Planned event duration */
    "duration": 3000000,
    /** Strategy for time management */
    "timeStrategy": "lock-duration",
    /** Whether the event is linked to the start of the previous */
    "linkStart": true,
    /** Action to take at the end of the event */
    "endAction": "none",
    /** Type of timer used for the event */
    "timerType": "count-down",
    /** Whether the timer counts to the end */
    "countToEnd": false,
    /** Whether the event is skipped */
    "skip": false,
    /** Note associated with the event */
    "note": "Liam Carter, Sophia Patel + PowerPoint",
    /** Colour code for the event */
    "colour": "#77C785",
    /** Current delay inherited from the rundown schedule */
    "delay": 0,
    /** Day offset for the event */
    "dayOffset": 0,
    /** Time gap between events */
    "gap": 0,
    /** Cue number for the event */
    "cue": "1.2",
    /** Parent group ID */
    "parent": "7eaf99",
    /** Revision number for the entry */
    "revision": 0,
    /** Warning time */
    "timeWarning": 120000,
    /** Danger time */
    "timeDanger": 60000,
    /** Custom fields for the event */
    "custom": {},
    /** Triggers associated with the event */
    "triggers": [],
  },

  /** Current group data */
  "groupNow": {
    /** Unique identifier for the group */
    "id": "7eaf99",
    /** Entry type */
    "type": "group",
    /** Title of the group */
    "title": "Morning Sessions",
    /** Note associated with the group */
    "note": "",
    /** ID of entries nested in the group */
    "entries": ["9bf60f", "bf71a2", "c2697f", "fa593e", "a8b0b3"],
    /** Optional, user defined target duration */
    "targetDuration": null,
    /** Colour code for the group */
    "colour": "#339E4E",
    /** Custom fields for the group */
    "custom": {},
    /** Revision number for the entry */
    "revision": 0,
    /** Timestamp of the first event's planned start time */
    "timeStart": 36000000,
    /** Timestamp of the last event's planned end time */
    "timeEnd": 43200000,
    /** Accumulated events duration */
    "duration": 7200000,
    /** Whether the first event has its start time linked */
    "isFirstLinked": false,
  },

  /** Message object with data */
  "message": {
    /** Timer view message data */
    "timer": {
      /** Text associated with the timer view */
      "text": "",
      /** Whether the message is visible */
      "visible": false,
      /** Whether the timer view is blinking */
      "blink": false,
      /** Whether the timer view is blacked out */
      "blackout": false,
      /** Secondary source for the view */
      "secondarySource": null,
    },
    /** Secondary message text */
    "secondary": "",
  },

  /** Auxiliary timer 1 */
  "auxtimer1": {
    /** Duration of the timer */
    "duration": 300000,
    /** Current timer value */
    "current": 300000,
    /** Playback state (e.g., play, pause, stop) */
    "playback": "stop",
    /** Direction of the timer */
    "direction": "count-down",
  },

  /** Auxiliary timer 2 */
  "auxtimer2": {
    /** Duration of the timer */
    "duration": 300000,
    /** Current timer value */
    "current": 300000,
    /** Playback state (e.g., play, pause, stop) */
    "playback": "stop",
    /** Direction of the timer */
    "direction": "count-down",
  },

  /** Auxiliary timer 3 */
  "auxtimer3": {
    /** Duration of the timer */
    "duration": 300000,
    /** Current timer value */
    "current": 300000,
    /** Playback state (e.g., play, pause, stop) */
    "playback": "stop",
    /** Direction of the timer */
    "direction": "count-down",
  },
}
```

## Links

- [Ontime Documentation](https://docs.getontime.no)
- [GitHub Repository](https://github.com/getontime/ontime)
- [Runtime data reference](https://docs.getontime.no/api/data/runtime-data/)
