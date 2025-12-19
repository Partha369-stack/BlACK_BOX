import app, { initializeHealthMonitor } from './app';
import { logger } from './services/logger';
// Redis temporarily disabled
// import { redisClient } from './services/redisClient';

const PORT = process.env.PORT || 3001;

const httpServer = app.listen(PORT, () => {
  const startupMessage = `Backend Server Started - Listening on port ${PORT}`;
  console.log(`
  🚀 Backend Server Running!
  --------------------------
  🔊 Listening on port ${PORT}
  🔌 API mounted at /machines
  `);

  // Log server startup
  logger.info(startupMessage, {
    source: 'server',
    service: 'backend',
    metadata: {
      port: PORT,
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

// Redis temporarily disabled
// redisClient.connect().then(() => {
//   console.log('✅ Redis Client initialized');
//   logger.info('Redis connection established', {
//     source: 'server',
//     service: 'backend',
//     metadata: {
//       status: 'connected'
//     }
//   });
// }).catch(err => {
//   console.error('❌ Failed to connect to Redis:', err);
//   logger.error('Redis connection failed', {
//     source: 'server',
//     service: 'backend',
//     metadata: {
//       error: err.message,
//       stack: err.stack
//     }
//   });
// });

// Initialize Health Monitor with the HTTP server
initializeHealthMonitor(httpServer);


