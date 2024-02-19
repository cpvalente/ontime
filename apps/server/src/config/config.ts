export const config = {
  database: {
    testdb: 'test-db',
    directory: 'db',
    filename: 'db.json',
  },
  styles: {
    directory: 'styles',
    filename: 'override.css',
  },
  demo: {
    directory: 'demo',
    filename: ['app.js', 'index.html', 'styles.css'],
  },
  restoreFile: 'ontime.restore',
};

export const timerConfig = {
  skipLimit: 1000, // threshold of skip for recalculating
  updateRate: 32, // how often do we update the timer
  notificationRate: 1000, // how often do we notify clients and integrations
};
