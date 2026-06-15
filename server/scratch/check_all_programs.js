const { Pool } = require('pg');

async function run() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:123@localhost:5432/PathMinded_DB',
  });

  try {
    const res = await pool.query("SELECT id, program_code, program_name FROM programs");
    console.log('PROGRAMS:');
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
