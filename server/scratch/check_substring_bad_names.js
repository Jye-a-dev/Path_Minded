const { Pool } = require('pg');

async function run() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:123@localhost:5432/PathMinded_DB',
  });

  try {
    const res = await pool.query(
      "SELECT id, program_id, course_code, course_name, course_type FROM curriculum_courses WHERE course_name ILIKE '%bắt buộc%' OR course_name ILIKE '%thể chất%' OR course_name ILIKE '%tiếng anh%' OR course_name ILIKE '%quốc phòng%'"
    );
    console.log('BAD NAME ROWS:', res.rows.length);
    console.table(res.rows.slice(0, 50));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
