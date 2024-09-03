import { EndAction, OntimeRundown, SupportedEvent, TimerType, TimeStrategy } from 'ontime-types';

export const testKendal: OntimeRundown = [
  {
    title: 'PREP',
    type: SupportedEvent.Block,
    id: 'a699d5',
  },
  {
    id: '81a7ba',
    type: SupportedEvent.Event,
    title: 'PREP',
    timeStart: 33000000,
    timeEnd: 36000000,
    duration: 3000000,
    timeStrategy: TimeStrategy.LockEnd,
    linkStart: null,
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#9d9d9d',
    cue: 'SF1.01',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {
      notes: 'Ari to lead',
      key: 'A',
    },
    delay: 0,
  },
  {
    id: 'fe131f',
    type: SupportedEvent.Event,
    title: 'RIG',
    timeStart: 36000000,
    timeEnd: 39600000,
    duration: 3600000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: '81a7ba',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: 'this one has a note\nwhich is multiline\nalright',
    colour: '#FFCC78',
    cue: 'SF1.02',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {
      notes: 'Ari to lead',
      key: 'A',
    },
    delay: 0,
  },
  {
    id: 'eee750',
    type: SupportedEvent.Event,
    title: 'SYSTEMS CHECK',
    timeStart: 39600000,
    timeEnd: 43200000,
    duration: 3600000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: 'fe131f',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#FFAB33',
    cue: 'SF1.03',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    title: 'ON AIR',
    type: SupportedEvent.Block,
    id: 'b58839',
  },
  {
    id: '838a83',
    type: SupportedEvent.Event,
    title: 'ON AIR - TITLES',
    timeStart: 43200000,
    timeEnd: 45000000,
    duration: 1800000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: 'eee750',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#FF7878',
    cue: 'SF1.04',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: 'c6fe38',
    type: SupportedEvent.Event,
    title: 'ARTIST NAME',
    timeStart: 45000000,
    timeEnd: 46800000,
    duration: 1800000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: '838a83',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#FF7878',
    cue: 'SF1.05',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: '239149',
    type: SupportedEvent.Event,
    title: 'CHANGE OVER',
    timeStart: 46800000,
    timeEnd: 48300000,
    duration: 1500000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: 'c6fe38',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#77C785',
    cue: 'SF1.06',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: '973e31',
    type: SupportedEvent.Event,
    title: 'ARTIST NAME',
    timeStart: 48300000,
    timeEnd: 50100000,
    duration: 1800000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: '239149',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#FF7878',
    cue: 'SF1.07',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: '04de07',
    type: SupportedEvent.Event,
    title: 'CHANGE OVER',
    timeStart: 50100000,
    timeEnd: 51300000,
    duration: 1200000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: '973e31',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#77C785',
    cue: 'SF1.08',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: 'b13d25',
    type: SupportedEvent.Event,
    title: 'ARTIST NAME',
    timeStart: 51300000,
    timeEnd: 53100000,
    duration: 1800000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: '04de07',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#FF7878',
    cue: 'SF1.09',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: 'f9998b',
    type: SupportedEvent.Event,
    title: 'CHANGE OVER',
    timeStart: 53100000,
    timeEnd: 54300000,
    duration: 1200000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: 'b13d25',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#77C785',
    cue: 'SF1.10',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: '60557e',
    type: SupportedEvent.Event,
    title: 'ARTIST NAME',
    timeStart: 54300000,
    timeEnd: 56100000,
    duration: 1800000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: 'f9998b',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#FF7878',
    cue: 'SF1.11',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: 'af5fb7',
    type: SupportedEvent.Event,
    title: 'CHANGE OVER',
    timeStart: 56100000,
    timeEnd: 57900000,
    duration: 1800000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: '60557e',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#77C785',
    cue: 'SF1.12',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: 'e03705',
    type: SupportedEvent.Event,
    title: 'ARTIST NAME',
    timeStart: 57900000,
    timeEnd: 59100000,
    duration: 1200000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: 'af5fb7',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#FF7878',
    cue: 'SF1.13',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: '2e99c4',
    type: SupportedEvent.Event,
    title: 'CHANGE OVER',
    timeStart: 59100000,
    timeEnd: 60900000,
    duration: 1800000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: 'e03705',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#77C785',
    cue: 'SF1.14',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: '5e4312',
    type: SupportedEvent.Event,
    title: 'ARTIST NAME',
    timeStart: 60900000,
    timeEnd: 62100000,
    duration: 1200000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: '2e99c4',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#FF7878',
    cue: 'SF1.15',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: 'a28751',
    type: SupportedEvent.Event,
    title: 'CHANGE OVER',
    timeStart: 62100000,
    timeEnd: 64200000,
    duration: 2100000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: '5e4312',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#77C785',
    cue: 'SF1.16',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: '204a86',
    type: SupportedEvent.Event,
    title: 'ARTIST NAME',
    timeStart: 64200000,
    timeEnd: 65700000,
    duration: 1500000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: 'a28751',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#FF7878',
    cue: 'SF1.17',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: 'a85f50',
    type: SupportedEvent.Event,
    title: 'CHANGE OVER',
    timeStart: 65700000,
    timeEnd: 67800000,
    duration: 2100000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: '204a86',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#77C785',
    cue: 'SF1.18',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: '3b5ccf',
    type: SupportedEvent.Event,
    title: 'ARTIST NAME',
    timeStart: 67800000,
    timeEnd: 71400000,
    duration: 3600000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: 'a85f50',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#FF7878',
    cue: 'SF1.18',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: 'f9af23',
    type: SupportedEvent.Event,
    title: 'CHANGE OVER',
    timeStart: 71400000,
    timeEnd: 73500000,
    duration: 2100000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: '3b5ccf',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#77C785',
    cue: 'SF1.19',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: 'a6ef47',
    type: SupportedEvent.Event,
    title: 'ARTIST NAME LAST',
    timeStart: 75600000,
    timeEnd: 81000000,
    duration: 5400000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: null,
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#FF7878',
    cue: 'SF1.20',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    title: 'OFF AIR',
    type: SupportedEvent.Block,
    id: '72e18d',
  },
  {
    id: 'c0ffe0',
    type: SupportedEvent.Event,
    title: 'SUPER DERIG - NO ONE GOES HOME',
    timeStart: 81000000,
    timeEnd: 1800000,
    duration: 7200000,
    timeStrategy: TimeStrategy.LockEnd,
    linkStart: 'a6ef47',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '',
    cue: 'SF1.21',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: '14b94b',
    type: SupportedEvent.Event,
    title: 'DRINKS!',
    timeStart: 1800000,
    timeEnd: 2400000,
    duration: 600000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: 'c0ffe0',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '#779BE7',
    cue: 'SF1.22',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
  {
    id: 'ca327f',
    type: SupportedEvent.Event,
    title: '',
    timeStart: 36000000,
    timeEnd: 36600000,
    duration: 600000,
    timeStrategy: TimeStrategy.LockDuration,
    linkStart: null,
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    isPublic: true,
    skip: false,
    note: '',
    colour: '',
    cue: 'SF1.23',
    revision: 3,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
    delay: 0,
  },
];
