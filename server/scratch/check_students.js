const { Pool } = require('pg');

async function run() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:123@localhost:5432/PathMinded_DB',
  });

  try {
    const mappings = await pool.query("SELECT * FROM curriculum_column_mappings WHERE mapping_type = 'CLASS'");
    console.log('CLASS MAPPINGS:');
    console.table(mappings.rows);

    const imports = await pool.query('SELECT * FROM class_imports ORDER BY uploaded_at DESC LIMIT 5');
    console.log('CLASS IMPORTS:');
    console.table(imports.rows);

    const importRows = await pool.query('SELECT * FROM class_import_rows ORDER BY id DESC LIMIT 5');
    console.log('CLASS IMPORT ROWS (last 5):');
    console.table(importRows.rows);

    const students = await pool.query('SELECT s.*, u.email FROM students s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC LIMIT 5');
    console.log('STUDENTS (last 5):');
    console.table(students.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
