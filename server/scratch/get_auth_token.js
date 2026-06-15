const { Pool } = require('pg');

async function run() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:123@localhost:5432/PathMinded_DB',
  });

  try {
    const res = await pool.query("SELECT email, password_hash, role FROM users LIMIT 10");
    console.log('USERS:');
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
