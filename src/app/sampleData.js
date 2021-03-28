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
      order: 1,
      title: 'Is the internet a fad?',
      subtitle: 'It is',
      presenter: 'Carlos Valente',
      timeStart: new Date('October 13, 2014 11:30:00'),
      timeEnd: new Date('October 13, 2014 11:50:00'),
      clockStarted: dummy,
      timerDuration: 60,
      type: 'event',
    },
    {
      id: 0.4849093424577693,
      order: 2,
      timerDuration: 25,
      type: 'delay',
    },
    {
      id: '2',
      order: 3,
      title: 'Is reddit a dictatorship?',
      subtitle: 'It is',
      presenter: 'Carlos Valente',
      timeStart: new Date('October 13, 2014 12:30:00'),
      timeEnd: new Date('October 13, 2014 12:50:00'),
      clockStarted: dummy,
      timerDuration: 60,
      type: 'event',
    },
    {
      id: '3',
      order: 4,
      title: 'Out of words',
      subtitle: '',
      presenter: 'Carlos Valente',
      timeStart: new Date('October 13, 2014 13:30:00'),
      timeEnd: new Date('October 13, 2014 13:50:00'),
      clockStarted: dummy,
      timerDuration: 60,
      type: 'event',
    },
  ],
};
