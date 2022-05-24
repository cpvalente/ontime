(async () => {
  let loaded;
  try {
    const { startServer, startOSCServer } = await import('./app.js');
    // Start express server
    loaded = await startServer();

    // Start OSC Server (API)
    await startOSCServer();
  } catch (error) {
    console.log(error);
  }
  console.log(loaded);
})();
