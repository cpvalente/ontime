import { EndAction, OntimeBlock, OntimeDelay, OntimeEvent, SupportedEvent, TimerType } from 'ontime-types';

export const event: Omit<OntimeEvent, 'id'> = {
  title: '',
  subtitle: '',
  presenter: '',
  note: '',
  endAction: EndAction.None,
  timerType: TimerType.CountDown,
  timeStart: 0,
  timeEnd: 0,
  duration: 0,
  isPublic: false,
  skip: false,
  colour: '',
  user0: '',
  user1: '',
  user2: '',
  user3: '',
  user4: '',
  user5: '',
  user6: '',
  user7: '',
  user8: '',
  user9: '',
  type: SupportedEvent.Event,
  revision: 0,
};

export const delay: Omit<OntimeDelay, 'id'> = {
  duration: 0,
  type: SupportedEvent.Delay,
  revision: 0,
};

export const block: Omit<OntimeBlock, 'id'> = {
  title: '',
  type: SupportedEvent.Block,
};
