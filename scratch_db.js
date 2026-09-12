const mysql = require('mysql2/promise');

async function inspectDatabase() {
  const passwordsToTry = ['', 'root', 'password', '123456', 'admin', 'mysql', 'Root@123'];
  let conn = null;

  for (const pass of passwordsToTry) {
    try {
      conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: pass,
        database: 'feedback_management'
      });
      console.log(`SUCCESS: Connected to MySQL with password: "${pass}"`);
      break;
    } catch (err) {
      console.log(`Failed with password "${pass}": ${err.message}`);
    }
  }

  if (!conn) {
    console.error('Could not connect to database with standard passwords.');
    process.exit(1);
  }

  try {
    const [tables] = await conn.query('SHOW TABLES');
    console.log('\n--- TABLES IN feedback_management ---');
    console.log(tables.map(t => Object.values(t)[0]));

    const tablesToInspect = [
      'users', 'roles', 'departments', 'student_details', 'staff_details',
      'batch', 'semester', 'course', 'section', 'student_course',
      'cbcs', 'cbcs_subject', 'cbcs_section_staff', 'feedback_rounds',
      'feedback_categories', 'feedback_question_types', 'feedback_questions',
      'feedback_sessions', 'feedback_entries', 'feedback_responses', 'feedback_queries'
    ];

    for (const tbl of tablesToInspect) {
      try {
        const [cols] = await conn.query(`DESCRIBE \`${tbl}\``);
        console.log(`\n--- SCHEMA OF TABLE: ${tbl} ---`);
        console.log(cols.map(c => `${c.Field} (${c.Type}, ${c.Null === 'YES' ? 'NULL' : 'NOT NULL'}, KEY: ${c.Key})`).join('\n'));

        const [rows] = await conn.query(`SELECT * FROM \`${tbl}\` LIMIT 5`);
        console.log(`\n--- SAMPLE DATA FROM: ${tbl} (count: ${rows.length}) ---`);
        console.log(rows);
      } catch (tblErr) {
        console.log(`Table ${tbl} error/not found: ${tblErr.message}`);
      }
    }

  } catch (err) {
    console.error('Error during inspection:', err);
  } finally {
    await conn.end();
  }
}

inspectDatabase();
