const dummy = new Date();

export const sampleData = {
  message: {
    text: 'Hurry Up!',
    color: '#F00',
    active: false,
  },
  events: [
    {
      id: '1',
      title: 'Is the internet a fad?',
      subtitle: 'It is',
      presenter: 'Carlos Valente',
      timeStart: new Date('March 24, 2021 03:25:00'),
      timeEnd: new Date('March 24, 2021 04:24:00'),
      clockStarted: dummy,
      timerDuration: 10,
    },
    {
      id: '2',
      title: 'Is reddit a dictatorship?',
      subtitle: 'It is',
      presenter: 'Carlos Valente',
      timeStart: new Date('March 24, 2021 04:25:00'),
      timeEnd: new Date('March 24, 2021 05:24:00'),
      clockStarted: dummy,
      timerDuration: 10,
    },
  ],
};
