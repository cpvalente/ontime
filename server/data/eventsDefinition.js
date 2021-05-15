const event = {
  title: '',
  subtitle: '',
  presenter: '',
  note: '',
  timeStart: 0,
  timeEnd: 0,
  isPublic: false,
  type: 'event',
  revision: 0,
};

const delay = {
  duration: 0,
  type: 'delay',
  revision: 0,
};

const block = {
  type: 'block',
};

module.exports = { event, delay, block };
