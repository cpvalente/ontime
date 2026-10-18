import { DatabaseModel, OntimeView } from 'ontime-types';

import { ONTIME_VERSION } from '../ONTIME_VERSION.js';
import { backstageRundown, broadcastRundown, stageRundown } from './demoRundowns.js';

export const demoDb: DatabaseModel = {
  rundowns: {
    default: stageRundown,
    backstage: backstageRundown,
    broadcast: broadcastRundown,
  },
  project: {
    title: 'Ontime Demo Project',
    description: 'Annual innovation summit',
    url: 'https://docs.getontime.no/',
    info: 'MAIN HALL\nDoors: 10:30 · Show: 11:00–14:00\nLunch: Main foyer · 12:00–13:00',
    logo: 'ontime-logo.png',
    custom: [
      {
        title: 'Guest information',
        value:
          'Guest Wi-Fi: Ontime Demo\nGreen room: Level 2 · Room 204\nOur team at the information desk can help with accessibility and venue directions.',
        url: '',
      },
      {
        title: 'Stage screens',
        value: 'Main Hall presentation feed.\nUse 16:9 slides and check in with the AV team before your session.',
        url: 'https://www.getontime.no/images/aux/demo-slide1.webp',
      },
    ],
  },
  settings: {
    version: ONTIME_VERSION,
    editorKey: null,
    operatorKey: null,
    timeFormat: '24',
    language: 'en',
    auxTimerNames: ['Q&A', 'Break', 'Reset'],
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
        'hideclock=true&hidecards=true&hideprogress=true&hidemessage=true&hidesecondary=true&hidelogo=true&font=arial+black&keycolour=00ff00',
      displayInNav: false,
    },
  ],
  customFields: {
    fields: {
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
    order: ['Video_Notes', 'Audio_Notes', 'PowerPoint_Name', 'PowerPoint_Slide'],
  },
  automation: {
    enabledAutomations: false,
    enabledOscIn: false,
    oscPortIn: 8888,
    triggers: [],
    automations: {},
  },
};
