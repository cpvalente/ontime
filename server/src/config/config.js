export const config = {
  timer: {
    refresh: 1000,
  },
  server: {
    port: 4001,
  },
  database: {
    filename: 'db.json',
    tablename: 'events',
  },
  osc: {
    port: 8888,
    ipOut: '127.0.0.1',
    portOut: 9999,
  },
};
