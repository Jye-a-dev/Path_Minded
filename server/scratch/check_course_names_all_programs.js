const { Pool } = require('pg');

async function run() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:123@localhost:5432/PathMinded_DB',
  });

  try {
    const res = await pool.query(
      "SELECT id, program_id, course_code, course_name, course_type FROM curriculum_courses WHERE course_code = '71PEKC10062'"
    );
    console.log('COURSE CODES IN DB (ALL PROGRAMS):');
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
