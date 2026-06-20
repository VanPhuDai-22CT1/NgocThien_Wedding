import { Sequelize } from 'sequelize';
import { loadBackendEnv } from './env';

loadBackendEnv();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ngocthienwedding',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: false,
    timezone: '+07:00',
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: Number(process.env.DB_POOL_MIN || 0),
      acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
      idle: Number(process.env.DB_POOL_IDLE || 10000),
    },
    dialectOptions: {
      charset: 'utf8mb4',
      // ensure proper support for utf8mb4 and large text
      supportBigNumbers: true,
      multipleStatements: true,
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
  }
);

export default sequelize;
