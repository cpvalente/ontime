const dummy = new Date();

export const sampleData = {
  events: [
    {
      id: '1',
      title: 'Is the internet a fad?',
      subtitle: 'It is',
      presenter: 'Carlos Valente',
      timeStart: '10:00',
      timeEnd: '11:30',
      clockStarted: dummy,
      timerDuration: 10,
      message: {
        text: 'Hurry Up!',
        color: '#F00',
        active: false,
      },
    },
    {
      id: '2',
      title: 'Is reddit a dictatorship?',
      subtitle: 'It is',
      presenter: 'Carlos Valente',
      timeStart: '11:40',
      timeEnd: '13:00',
      clockStarted: dummy,
      timerDuration: 10,
      message: {
        text: 'Hurry Up!',
        color: '#F00',
        active: false,
      },
    },
  ],
};
