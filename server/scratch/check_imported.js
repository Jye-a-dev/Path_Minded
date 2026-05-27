/* eslint-disable */
const { Pool } = require('pg');

async function run() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:123@localhost:5432/PathMinded_DB',
  });

  try {
    const res1 = await pool.query('SELECT * FROM curriculum_imports');
    console.log('IMPORTS:', res1.rows);
    const res2 = await pool.query('SELECT * FROM parse_warnings LIMIT 20');
    console.log('WARNINGS:', res2.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

void run();
