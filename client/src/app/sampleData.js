const dummy = new Date();

export const sampleData = {
  presenterMessage: {
    text: 'Only the presenter sees this',
    active: false,
  },
  publicMessage: {
    text: 'Everyone sees this',
    active: false,
  },
  events: [
    {
      id: '1',
      title: 'Is the internet a fad?',
      subtitle: 'It is',
      presenter: 'Carlos Valente',
      timeStart: 37800000,
      timeEnd: 39600000,
      clockStarted: dummy,
      timerDuration: 60,
      type: 'event',
    },
    {
      id: 0.4849093424577693,
      duration: 25*60000,
      type: 'delay',
    },
    {
      id: '2',
      title: 'Is reddit a dictatorship?',
      subtitle: 'It is',
      presenter: 'Carlos Valente',
      timeStart: 39600000,
      timeEnd: 40320000,
      clockStarted: dummy,
      timerDuration: 60*60000,
      type: 'event',
    },
    {
      id: '3',
      title: 'Out of words',
      subtitle: '',
      presenter: 'Carlos Valente',
      timeStart: 41400000,
      timeEnd: 43200000,
      clockStarted: dummy,
      timerDuration: 60,
      type: 'event',
    },
  ],
};
