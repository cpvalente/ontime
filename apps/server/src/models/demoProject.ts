import { DatabaseModel, OntimeView, TimerLifeCycle } from 'ontime-types';

import { backstageRundown, broadcastRundown, stageRundown } from './demoRundowns.js';

export const demoDb: DatabaseModel = {
  rundowns: {
    default: stageRundown,
    backstage: backstageRundown,
    broadcast: broadcastRundown,
  },
  project: {
    title: 'Ontime Demo Project',
    description: 'Demo Project to get you started',
    url: 'https://docs.getontime.no/',
    info: 'Use Project info to share information to various Ontime views.\nie. Venue info, wifi, staff details, etc.',
    logo: 'ontime-logo.png',
    custom: [
      {
        title: 'Custom data',
        value:
          'Add additional, custom data fields to the project along with optional links to images. \nThe image will be rendered in the views',
        url: '',
      },
    ],
  },
  settings: {
    version: '-',
    editorKey: null,
    operatorKey: null,
    timeFormat: '24',
    language: 'en',
  },
  viewSettings: {
    dangerColor: '#ff7300',
    normalColor: '#ffffffcc',
    overrideStyles: false,
    warningColor: '#ffa528',
  },
  urlPresets: [
    {
      enabled: true,
      alias: 'clock',
      target: OntimeView.Timer,
      search:
        'showLeadingZeros=true&timerType=clock&hideClock=true&hideCards=true&hideProgress=true&hideMessage=true&hideSecondary=true&hideLogo=true',
      displayInNav: false,
    },
    {
      enabled: true,
      alias: 'minimal',
      target: OntimeView.Timer,
      search:
        'hideclock=true&hidecards=true&hideprogress=true&hidemessage=true&hidesecondary=true&hidelogo=true&font=arial+black&keycolour=00ff00&timerColour=ffffff',
      displayInNav: false,
    },
  ],
  customFields: {
    Video_Notes: {
      type: 'text',
      colour: '#FFAB33',
      label: 'Video Notes',
    },
    Audio_Notes: {
      type: 'text',
      colour: '#339E4E',
      label: 'Audio Notes',
    },
    PowerPoint_Name: {
      type: 'text',
      colour: '#3E75E8',
      label: 'PowerPoint Name',
    },
    PowerPoint_Slide: {
      type: 'image',
      colour: '#ED3333',
      label: 'PowerPoint Slide',
    },
  },
  /**
   * The demo ships with working automations so the engine is visible the first time
   * someone presses Play, rather than hidden behind an empty settings panel.
   *
   * Everything that actually fires is an Ontime action: the demo must not put traffic
   * on whatever network it happens to be opened on. The OSC entry is there to be read
   * and edited, and is deliberately left without a trigger.
   *
   * The ids are hand written and must match the map keys. Ids are only generated for
   * automations created through the DAO, so literals are safe here.
   */
  automation: {
    enabledAutomations: true,
    // never open a listening socket without the user asking for it
    enabledOscIn: false,
    oscPortIn: 8888,
    triggers: [
      {
        id: 'demo-trigger-aux',
        title: 'Demo: aux timer on start',
        trigger: TimerLifeCycle.onStart,
        automationId: 'demo-aux-timer',
      },
    ],
    automations: {
      'demo-aux-timer': {
        id: 'demo-aux-timer',
        title: 'Demo: run Aux Timer 1 with the event',
        filterRule: 'all',
        filters: [],
        outputs: [
          { type: 'ontime', action: 'aux1-set', time: '00:05:00' },
          { type: 'ontime', action: 'aux1-start' },
        ],
      },
      'demo-danger-message': {
        id: 'demo-danger-message',
        title: 'Demo: warn the stage at danger',
        filterRule: 'all',
        filters: [],
        // self labelled, so nobody mistakes it for something Ontime does on its own
        outputs: [{ type: 'ontime', action: 'message-set', text: 'Demo automation: please wrap up', visible: true }],
      },
      'demo-osc-example': {
        id: 'demo-osc-example',
        title: 'Demo: OSC to a lighting console (example, not wired up)',
        filterRule: 'all',
        filters: [],
        outputs: [{ type: 'osc', targetIP: '127.0.0.1', targetPort: 8000, address: '/ontime/go', args: '1' }],
      },
    },
  },
};
