import { DatabaseModel, OntimeView } from 'ontime-types';

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
    },
    {
      enabled: true,
      alias: 'minimal',
      target: OntimeView.Timer,
      search:
        'hideclock=true&hidecards=true&hideprogress=true&hidemessage=true&hidesecondary=true&hidelogo=true&font=arial+black&keycolour=00ff00&timerColour=ffffff',
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
  automation: {
    enabledAutomations: false,
    enabledOscIn: false,
    oscPortIn: 8888,
    triggers: [],
    automations: {},
  },
};
