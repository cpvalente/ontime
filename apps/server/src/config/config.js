export const config = {
  timer: {
    refresh: 1000,
  },
  server: {
    port: 4001,
  },
  database: {
    testdb: 'test-db',
    directory: 'preloaded-db',
    filename: 'db.json',
    tablename: 'events',
  },
  osc: {
    portIn: 8888,
    portOut: 9999,
    targetIP: '127.0.0.1',
    enabledIn: true,
    enabledOut: true,
  },
  http: {
    user: '',
    pwd: '',
    enabled: true,
  },
};
