const { Pool } = require('pg');

async function run() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:123@localhost:5432/PathMinded_DB',
  });

  try {
    const res = await pool.query(
      "SELECT * FROM curriculum_courses WHERE program_id = '790e104d-4bb6-433a-9ee8-5969e1dc99a6' AND course_code = '71ITBS10103'"
    );
    console.log('COURSE DETAIL:');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
