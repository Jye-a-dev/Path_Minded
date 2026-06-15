const { Pool } = require('pg');

async function run() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:123@localhost:5432/PathMinded_DB',
  });

  try {
    const res = await pool.query(
      "SELECT id, program_id, course_code, course_name, course_type FROM curriculum_courses WHERE course_name IN ('Bắt buộc', 'Tự chọn', 'Thể chất', 'Tiếng Anh', 'Quốc phòng')"
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
