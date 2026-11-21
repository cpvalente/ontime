import { DatabaseModel, OntimeView } from 'ontime-types';
import { defaultTeleprompterSettings, scriptSourceOfCustomField } from 'ontime-utils';

import { backstageRundown, broadcastRundown, stageRundown } from './demoRundowns.js';

/** each project made from the demo gets its own id */
export const demoDb: Omit<DatabaseModel, 'projectId'> = {
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
    version: '-',
    editorKey: null,
    operatorKey: null,
    timeFormat: '24',
    language: 'en',
    auxTimerNames: ['Q&A', 'Break', 'Reset'],
    phaseThresholds: {
      warning: { unit: 'time', value: 120000 },
      danger: { unit: 'time', value: 60000 },
    },
  },
  viewSettings: {
    overrideStyles: false,
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
  customFields: [
    { key: 'Video_Notes', type: 'text', colour: '#FFAB33', label: 'Video Notes' },
    { key: 'Audio_Notes', type: 'text', colour: '#339E4E', label: 'Audio Notes' },
    { key: 'PowerPoint_Name', type: 'text', colour: '#3E75E8', label: 'PowerPoint Name' },
    { key: 'PowerPoint_Slide', type: 'image', colour: '#ED3333', label: 'PowerPoint Slide' },
    {
      key: 'Content_Status',
      type: 'option',
      colour: '#779BE7',
      label: 'Content Status',
      options: [
        { label: 'Received', colour: '#339E4E' },
        { label: 'In review', colour: '#FFAB33' },
        { label: 'Missing', colour: '#ED3333' },
        { label: 'Not needed', colour: '' },
      ],
    },
    { key: 'Script', type: 'text', colour: '#A790F5', label: 'Script' },
  ],
  automation: {
    enabledAutomations: false,
    enabledOscIn: false,
    oscPortIn: 8888,
    triggers: [],
    automations: {},
  },
  // the presenters read the Script field, the note holds production notes
  teleprompter: { ...defaultTeleprompterSettings, script: scriptSourceOfCustomField('Script') },
};
