const { Pool } = require('pg');

async function run() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:123@localhost:5432/PathMinded_DB',
  });

  try {
    const codes = [
      '71NAD210022',
      '71ITBS10103',
      '71ITBS10203',
      '71NAD110013',
      '71PEKC10062',
      '71PEYO10142',
      '71ITSE30103',
      '71ITMA10104',
      '71PETE10122',
      '71PEBB10032',
      '71PESC10112',
      '71PESS10162',
      '71ENG310033',
      '71MATL10053',
      '71PEVB10022',
      '71ENG410043',
      '71POLS10032'
    ];
    
    const res = await pool.query(
      "SELECT course_code, course_name, course_type FROM curriculum_courses WHERE program_id = '790e104d-4bb6-433a-9ee8-5969e1dc99a6' AND course_code = ANY($1)",
      [codes]
    );
    console.log('COURSE CODES IN DB:');
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
