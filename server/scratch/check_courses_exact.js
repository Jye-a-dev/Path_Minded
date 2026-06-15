const { Pool } = require('pg');

async function run() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:123@localhost:5432/PathMinded_DB',
  });

  try {
    const res = await pool.query(
      "SELECT course_code, course_name, credits, expected_semester, course_type FROM curriculum_courses WHERE program_id = '790e104d-4bb6-433a-9ee8-5969e1dc99a6' ORDER BY id DESC LIMIT 500"
    );
    console.log('COURSES COUNT:', res.rowCount);
    console.table(res.rows.slice(0, 20));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
