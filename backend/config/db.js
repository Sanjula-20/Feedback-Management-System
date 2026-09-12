const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'feedback_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log(`[DB] Connected successfully to MySQL database "${process.env.DB_NAME || 'feedback_management'}"`);
    connection.release();
  })
  .catch(err => {
    console.error(`[DB ERROR] Failed to connect to MySQL database:`, err.message);
  });

module.exports = pool;
