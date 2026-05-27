/* eslint-disable */
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ' 123',
  database: process.env.DB_NAME || 'PathMinded_DB',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function main() {
  console.log("Connecting to PostgreSQL...");
  const client = await pool.connect();
  console.log("Connected successfully!");

  try {
    console.log("Adding file_data column to curriculum_imports table...");
    await client.query(`
      ALTER TABLE curriculum_imports 
      ADD COLUMN IF NOT EXISTS file_data BYTEA;
    `);
    console.log("Column file_data added successfully or already exists.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
