import { DatabaseModel, EndAction, SupportedEvent, TimeStrategy, TimerType } from 'ontime-types';

export const demoDb: DatabaseModel = {
  rundowns: {
    default: {
      id: 'default',
      title: 'Eurovision Demo',
      order: [
        'block',
        '01e85',
        '1c420',
        'b7737',
        'd3a80',
        '8276c',
        '2340b',
        'cb90b',
        '503c4',
        '5e965',
        'bab4a',
        'd3eb1',
      ],
      entries: {
        block: {
          type: SupportedEvent.Block,
          events: ['32d31', '21cd2', '0b371', '3cd28', 'e457f'],
          id: 'block',
          title: 'Test Block',
          note: '',
          skip: false,
          colour: 'hotpink',
          revision: 0,
          startTime: null,
          endTime: null,
          duration: 0,
          isFirstLinked: false,
          numEvents: 0,
          custom: {
            song: 'Sekret',
            artist: 'Ronela Hajati',
          },
        },
        '32d31': {
          type: SupportedEvent.Event,
          id: '32d31',
          cue: 'SF1.01',
          title: 'Albania',
          note: 'SF1.01',
          endAction: EndAction.None,
          timerType: TimerType.CountDown,
          countToEnd: false,
          linkStart: false,
          timeStrategy: TimeStrategy.LockEnd,
          timeStart: 36000000,
          timeEnd: 37200000,
          duration: 1200000,
          isPublic: true,
          skip: false,
          colour: '',
          currentBlock: null,
          revision: 0,
          delay: 0,
          dayOffset: 0,
          gap: 0,
          timeWarning: 500000,
          timeDanger: 100000,
          custom: {
            song: 'Sekret',
            artist: 'Ronela Hajati',
          },
        },
        '21cd2': {
          type: SupportedEvent.Event,
          id: '21cd2',
          cue: 'SF1.02',
          title: 'Latvia',
          note: 'SF1.02',
          endAction: EndAction.None,
          timerType: TimerType.CountDown,
          countToEnd: false,
          linkStart: false,
          timeStrategy: TimeStrategy.LockEnd,
          timeStart: 37500000,
          timeEnd: 38700000,
          duration: 1200000,
          isPublic: true,
          skip: false,
          colour: '',
          currentBlock: null,
          revision: 0,
          delay: 0,
          dayOffset: 0,
          gap: 0,
          timeWarning: 500000,
          timeDanger: 100000,
          custom: {
            song: 'Eat Your Salad',
            artist: 'Citi Zeni',
          },
        },
        '0b371': {
          type: SupportedEvent.Event,
          id: '0b371',
          cue: 'SF1.03',
          title: 'Lithuania',
          note: 'SF1.03',
          endAction: EndAction.None,
          timerType: TimerType.CountDown,
          countToEnd: false,
          linkStart: false,
          timeStrategy: TimeStrategy.LockEnd,
          timeStart: 39000000,
          timeEnd: 40200000,
          duration: 1200000,
          isPublic: true,
          skip: false,
          colour: '',
          currentBlock: null,
          revision: 0,
          delay: 0,
          dayOffset: 0,
          gap: 0,
          timeWarning: 500000,
          timeDanger: 100000,
          custom: {
            song: 'Sentimentai',
            artist: 'Monika Liu',
          },
        },
        '3cd28': {
          type: SupportedEvent.Event,
          id: '3cd28',
          cue: 'SF1.04',
          title: 'Switzerland',
          note: 'SF1.04',
          endAction: EndAction.None,
          timerType: TimerType.CountDown,
          countToEnd: false,
          linkStart: false,
          timeStrategy: TimeStrategy.LockEnd,
          timeStart: 40500000,
          timeEnd: 41700000,
          duration: 1200000,
          isPublic: true,
          skip: false,
          colour: '',
          currentBlock: null,
          revision: 0,
          delay: 0,
          dayOffset: 0,
          gap: 0,
          timeWarning: 500000,
          timeDanger: 100000,
          custom: {
            song: 'Boys Do Cry',
            artist: 'Marius Bear',
          },
        },
        e457f: {
          type: SupportedEvent.Event,
          id: 'e457f',
          cue: 'SF1.05',
          title: 'Slovenia',
          note: 'SF1.05',
          endAction: EndAction.None,
          timerType: TimerType.CountDown,
          countToEnd: false,
          linkStart: false,
          timeStrategy: TimeStrategy.LockEnd,
          timeStart: 42000000,
          timeEnd: 43200000,
          duration: 1200000,
          isPublic: true,
          skip: false,
          colour: '',
          currentBlock: null,
          revision: 0,
          delay: 0,
          dayOffset: 0,
          gap: 0,
          timeWarning: 500000,
          timeDanger: 100000,
          custom: {
            song: 'Disko',
            artist: 'LPS',
          },
        },
        /// <----- BLOCK
        '01e85': {
          // TODO: this should be a marker type
          type: SupportedEvent.Block,
          id: '01e85',
          title: 'Lunch break',
          note: '',
          colour: '',
          events: [],
          skip: false,
          custom: {},
          revision: 0,
          startTime: null,
          endTime: null,
          duration: 0,
          isFirstLinked: false,
          numEvents: 0,
        },
        '1c420': {
          type: SupportedEvent.Event,
          id: '1c420',
          cue: 'SF1.06',
          title: 'Ukraine',
          note: 'SF1.06',
          endAction: EndAction.None,
          timerType: TimerType.CountDown,
          countToEnd: false,
          linkStart: false,
          timeStrategy: TimeStrategy.LockEnd,
          timeStart: 47100000,
          timeEnd: 48300000,
          duration: 1200000,
          isPublic: true,
          skip: false,
          colour: '',
          currentBlock: null,
          revision: 0,
          delay: 0,
          dayOffset: 0,
          gap: 0,
          timeWarning: 500000,
          timeDanger: 100000,
          custom: {
            song: 'Stefania',
            artist: 'Kalush Orchestra',
          },
        },
        b7737: {
          type: SupportedEvent.Event,
          id: 'b7737',
          cue: 'SF1.07',
          title: 'Bulgaria',
          note: 'SF1.07',
          endAction: EndAction.None,
          timerType: TimerType.CountDown,
          countToEnd: false,
          linkStart: false,
          timeStrategy: TimeStrategy.LockEnd,
          timeStart: 48600000,
          timeEnd: 49800000,
          duration: 1200000,
          isPublic: true,
          skip: false,
          colour: '',
          currentBlock: null,
          revision: 0,
          delay: 0,
          dayOffset: 0,
          gap: 0,
          timeWarning: 500000,
          timeDanger: 100000,
          custom: {
            song: 'Intention',
            artist: 'Intelligent Music Project',
          },
        },
        d3a80: {
          type: SupportedEvent.Event,
          id: 'd3a80',
          cue: 'SF1.08',
          title: 'Netherlands',
          note: 'SF1.08',
          endAction: EndAction.None,
          timerType: TimerType.CountDown,
          countToEnd: false,
          linkStart: false,
          timeStrategy: TimeStrategy.LockEnd,
          timeStart: 50100000,
          timeEnd: 51300000,
          duration: 1200000,
          isPublic: true,
          skip: false,
          colour: '',
          currentBlock: null,
          revision: 0,
          delay: 0,
          dayOffset: 0,
          gap: 0,
          timeWarning: 500000,
          timeDanger: 100000,
          custom: {
            song: 'De Diepte',
            artist: 'S10',
          },
        },
        '8276c': {
          type: SupportedEvent.Event,
          id: '8276c',
          cue: 'SF1.09',
          title: 'Moldova',
          note: 'SF1.09',
          endAction: EndAction.None,
          timerType: TimerType.CountDown,
          countToEnd: false,
          linkStart: false,
          timeStrategy: TimeStrategy.LockEnd,
          timeStart: 51600000,
          timeEnd: 52800000,
          duration: 1200000,
          isPublic: true,
          skip: false,
          colour: '',
          currentBlock: null,
          revision: 0,
          delay: 0,
          dayOffset: 0,
          gap: 0,
          timeWarning: 500000,
          timeDanger: 100000,
          custom: {
            song: 'Trenuletul',
            artist: 'Zdob si Zdub',
          },
        },
        '2340b': {
          type: SupportedEvent.Event,
          id: '2340b',
          cue: 'SF1.10',
          title: 'Portugal',
          note: 'SF1.10',
          endAction: EndAction.None,
          timerType: TimerType.CountDown,
          countToEnd: false,
          linkStart: false,
          timeStrategy: TimeStrategy.LockEnd,
          timeStart: 53100000,
          timeEnd: 54300000,
          duration: 1200000,
          isPublic: true,
          skip: false,
          colour: '',
          currentBlock: null,
          revision: 0,
          delay: 0,
          dayOffset: 0,
          gap: 0,
          timeWarning: 500000,
          timeDanger: 100000,
          custom: {
            song: 'Saudade Saudade',
            artist: 'Maro',
          },
        },
        /// <----- BLOCK
        cb90b: {
          // TODO: This should be a marker type
          type: SupportedEvent.Block,
          id: 'cb90b',
          title: 'Afternoon break',
          note: '',
          colour: '',
          events: [],
          skip: false,
          custom: {},
          revision: 0,
          startTime: null,
          endTime: null,
          duration: 0,
          isFirstLinked: false,
          numEvents: 0,
        },
        '503c4': {
          type: SupportedEvent.Event,
          id: '503c4',
          cue: 'SF1.11',
          title: 'Croatia',
          note: 'SF1.11',
          endAction: EndAction.None,
          timerType: TimerType.CountDown,
          countToEnd: false,
          linkStart: false,
          timeStrategy: TimeStrategy.LockEnd,
          timeStart: 56100000,
          timeEnd: 57300000,
          duration: 1200000,
          isPublic: true,
          skip: false,
          colour: '',
          currentBlock: null,
          revision: 0,
          delay: 0,
          dayOffset: 0,
          gap: 0,
          timeWarning: 500000,
          timeDanger: 100000,
          custom: {
            song: 'Guilty Pleasure',
            artist: 'Mia Dimsic',
          },
        },
        '5e965': {
          type: SupportedEvent.Event,
          id: '5e965',
          cue: 'SF1.12',
          title: 'Denmark',
          note: 'SF1.12',
          endAction: EndAction.None,
          timerType: TimerType.CountDown,
          countToEnd: false,
          linkStart: false,
          timeStrategy: TimeStrategy.LockEnd,
          timeStart: 57600000,
          timeEnd: 58800000,
          duration: 1200000,
          isPublic: true,
          skip: false,
          colour: '',
          currentBlock: null,
          revision: 0,
          delay: 0,
          dayOffset: 0,
          gap: 0,
          timeWarning: 500000,
          timeDanger: 100000,
          custom: {
            song: 'The Show',
            artist: 'Reddi',
          },
        },
        bab4a: {
          type: SupportedEvent.Event,
          id: 'bab4a',
          cue: 'SF1.13',
          title: 'Austria',
          note: 'SF1.13',
          endAction: EndAction.None,
          timerType: TimerType.CountDown,
          countToEnd: false,
          linkStart: false,
          timeStrategy: TimeStrategy.LockEnd,
          timeStart: 59100000,
          timeEnd: 60300000,
          duration: 1200000,
          isPublic: true,
          skip: false,
          colour: '',
          currentBlock: null,
          revision: 0,
          delay: 0,
          dayOffset: 0,
          gap: 0,
          timeWarning: 500000,
          timeDanger: 100000,
          custom: {
            song: 'Halo',
            artist: 'LUM!X & Pia Maria',
          },
        },
        d3eb1: {
          type: SupportedEvent.Event,
          id: 'd3eb1',
          cue: 'SF1.14',
          title: 'Greece',
          note: 'SF1.14',
          endAction: EndAction.None,
          timerType: TimerType.CountDown,
          countToEnd: false,
          linkStart: false,
          timeStrategy: TimeStrategy.LockEnd,
          timeStart: 60600000,
          timeEnd: 61800000,
          duration: 1200000,
          isPublic: true,
          skip: false,
          colour: '',
          currentBlock: null,
          revision: 0,
          delay: 0,
          dayOffset: 0,
          gap: 0,
          timeWarning: 500000,
          timeDanger: 100000,
          custom: {
            song: 'Die Together',
            artist: 'Amanda Tenfjord',
          },
        },
      },
      revision: 0,
    },
  },
  project: {
    title: 'Eurovision Song Contest',
    description: 'Turin 2022',
    publicUrl: 'www.getontime.no',
    publicInfo: 'Rehearsal Schedule - Turin 2022',
    backstageUrl: 'www.github.com/cpvalente/ontime',
    backstageInfo: 'Rehearsal Schedule - Turin 2022\nAll performers to wear full costumes for 1st rehearsal',
    projectLogo: null,
  },
  settings: {
    app: 'ontime',
    version: '-',
    serverPort: 4001,
    editorKey: null,
    operatorKey: null,
    timeFormat: '24',
    language: 'en',
  },
  viewSettings: {
    dangerColor: '#ED3333',
    endMessage: '',
    freezeEnd: false,
    normalColor: '#ffffffcc',
    overrideStyles: false,
    warningColor: '#FFAB33',
  },
  customFields: {
    song: {
      label: 'Song',
      type: 'string',
      colour: '#339E4E',
    },
    artist: {
      label: 'Artist',
      type: 'string',
      colour: '#3E75E8',
    },
  },
  urlPresets: [
    {
      enabled: true,
      alias: 'test',
      pathAndParams: 'lower?bg=ff2&text=f00&size=0.6&transition=5',
    },
  ],
  automation: {
    enabledAutomations: false,
    enabledOscIn: true,
    oscPortIn: 8888,
    triggers: [],
    automations: {},
  },
};
