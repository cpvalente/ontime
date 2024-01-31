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
  timeSkipLimit: 1000,
};
