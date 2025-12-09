import app, { initializeHealthMonitor } from './app';

const PORT = process.env.PORT || 3001;

const httpServer = app.listen(PORT, () => {
    console.log(`
  🚀 Backend Server Running!
  --------------------------
  🔊 Listening on port ${PORT}
  🔌 API mounted at /machines
  `);
});

// Initialize Health Monitor with the HTTP server
initializeHealthMonitor(httpServer);

