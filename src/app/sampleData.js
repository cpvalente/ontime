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
      timeStart: new Date('March 24, 2021 03:25:00'),
      timeEnd: new Date('March 24, 2021 04:24:00'),
      clockStarted: dummy,
      timerDuration: 60,
    },
    {
      id: '2',
      order: 2,
      title: 'Is reddit a dictatorship?',
      subtitle: 'It is',
      presenter: 'Carlos Valente',
      timeStart: new Date('March 24, 2021 04:25:00'),
      timeEnd: new Date('March 24, 2021 05:24:00'),
      clockStarted: dummy,
      timerDuration: 60,
    },
    {
      id: '3',
      order: 3,
      title: 'Out of words',
      subtitle: '',
      presenter: 'Carlos Valente',
      timeStart: new Date('March 24, 2021 05:25:00'),
      timeEnd: new Date('March 24, 2021 05:55:00'),
      clockStarted: dummy,
      timerDuration: 60,
    },
  ],
};
