const event = {
  order: 0,
  title: '',
  subtitle: '',
  presenter: '',
  timeStart: null,
  timeEnd: null,
  clockStarted: null,
  type: 'event',
};

const delay = {
  order: 0,
  timerDuration: 0,
  type: 'delay',
};

const block = {
  order: 0,
  type: 'block',
};

module.exports = { event, delay, block };
