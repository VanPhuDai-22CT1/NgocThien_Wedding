const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DB_NAME = process.env.DB_NAME || 'ngocthienwedding';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || 3306);

async function run() {
  try {
    console.log('Connecting to MySQL server...');
    const adminConn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true,
    });

    console.log(`Creating database if not exists: ${DB_NAME}`);
    await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);

    // choose SQL file to import
    const sqlFile = path.resolve(__dirname, '../database/ngocthienwedding_final.sql');
    if (!fs.existsSync(sqlFile)) {
      console.warn('SQL file not found at', sqlFile);
      await adminConn.end();
      return;
    }

    const sql = fs.readFileSync(sqlFile, { encoding: 'utf8' });

    console.log('Importing SQL file to database... This may take a while.');
    // connect directly to the created database
    const dbConn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      multipleStatements: true,
    });

    await dbConn.query(sql);
    console.log('✅ Database import completed.');

    await dbConn.end();
    await adminConn.end();
  } catch (err) {
    console.error('❌ Failed to initialize database:', err.message || err);
    process.exit(1);
  }
}

run();
