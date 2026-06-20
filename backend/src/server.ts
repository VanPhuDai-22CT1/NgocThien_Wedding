import app from './app';
import sequelize from './config/database';
import { loadBackendEnv } from './config/env';
import { ensureSchema } from './utils/ensureSchema';
import logger from './utils/logger';

loadBackendEnv();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    await ensureSchema();
    logger.info('✅ Database connection established');

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📚 API docs available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
