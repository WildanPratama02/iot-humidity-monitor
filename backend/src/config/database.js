/**
 * Database Configuration
 * PostgreSQL connection using pg pool
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'db_iot',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
});

// Test connection on startup
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected PostgreSQL pool error on idle client:', err.message);
});

module.exports = pool;
