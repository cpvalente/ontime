const dbModel = {
  events: [],
  event: {
    title: '',
    url: '',
    publicInfo: '',
    backStageInfo: '',
  },
  settings: {
    app: 'ontime',
    version: 1,
    osc_enabled: false,
    osc_port: 8888,
    lock: false,
  },
};

module.exports = { dbModel };
