const event = {
  order: 0,
  title: '',
  subtitle: '',
  presenter: '',
  timeStart: 0,
  timeEnd: 0,
  isPublic: false,
  type: 'event',
  revision: 0,
};

const delay = {
  order: 0,
  duration: 0,
  type: 'delay',
};

const block = {
  order: 0,
  type: 'block',
};

module.exports = { event, delay, block };
