const express = require('express');
const mysql = require('mysql');
const path = require('path');
const fs = require('fs');

// load .env (try backend/.env first, fallback to root .env)
const dotenvPath = fs.existsSync(path.join(__dirname, 'backend', '.env'))
  ? path.join(__dirname, 'backend', '.env')
  : path.join(__dirname, '.env');
require('dotenv').config({ path: dotenvPath });

const app = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uxi',
  port: Number(process.env.DB_PORT) || 3306,
  multipleStatements: true
};

let pool;

function createPool() {
  pool = mysql.createPool(dbConfig);

  pool.on && pool.on('error', (err) => {
    console.error('MySQL pool error', err);
    if (err && err.fatal) {
      console.log('Fatal DB error, recreating pool in 2s...');
      setTimeout(createPool, 2000);
    }
  });
}

createPool();

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

// Root route
app.get('/', (req, res) => {
  res.json({ message: `${process.env.APP_NAME || 'Ngọc Thiện Wedding'} API running on port ${process.env.PORT || 4000}` });
});

// helper: legacy style endpoints used by frontend
app.get('/api/legacy', async (req, res) => {
  const action = req.query.action;

  try {
    if (action === 'getConsultations') {
      const results = await query('SELECT * FROM consultations ORDER BY created_at DESC');
      return res.json({ success: true, data: results || [] });
    }

    return res.json({ success: false, message: 'Unknown action: ' + action });
  } catch (err) {
    console.error('DB error', err);
    return res.json({ success: false, message: 'Database error: ' + err.message });
  }
});

app.post('/api/legacy', async (req, res) => {
  const action = req.query.action;
  const data = req.body;

  try {
    if (action === 'updateConsultation') {
      const { id, name, service, event_date, note } = data;
      if (!id) return res.json({ success: false, message: 'ID is required' });
      await query('UPDATE consultations SET name = ?, service = ?, event_date = ?, note = ? WHERE id = ?', [name, service, event_date, note, id]);
      return res.json({ success: true, message: 'Consultation updated' });
    }

    if (action === 'deleteConsultation') {
      const { id } = data;
      if (!id) return res.json({ success: false, message: 'ID is required' });
      await query('DELETE FROM consultations WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Consultation deleted' });
    }

    return res.json({ success: false, message: 'Unknown action: ' + action });
  } catch (err) {
    console.error('DB error', err);
    return res.json({ success: false, message: 'Database error: ' + err.message });
  }
});

// Debug endpoint: list tables in the connected DB
app.get('/api/tables', async (req, res) => {
  try {
    const rows = await query('SHOW TABLES');
    res.json({ success: true, rows });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.get('/api/news', (req, res) => {
  res.json({ message: 'I am a message from Server!' });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection', reason);
});

app.listen(process.env.PORT || 4000, () => console.log('App listening on port', process.env.PORT || 4000));

