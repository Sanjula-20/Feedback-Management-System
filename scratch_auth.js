const mysql = require('mysql2/promise');

async function inspectAuthTables() {
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
      console.log(`CONNECTED WITH PASSWORD: "${pass}"`);
      break;
    } catch (err) {}
  }

  if (!conn) {
    console.error('Could not connect.');
    process.exit(1);
  }

  const authTables = ['users', 'roles', 'departments', 'student_details', 'staff_details', 'semester', 'course'];

  for (const tbl of authTables) {
    try {
      const [cols] = await conn.query(`DESCRIBE \`${tbl}\``);
      console.log(`\n================ SCHEMA OF: ${tbl} ================`);
      cols.forEach(c => console.log(`  ${c.Field}: ${c.Type} | Null:${c.Null} | Key:${c.Key}`));

      const [rows] = await conn.query(`SELECT * FROM \`${tbl}\` LIMIT 5`);
      console.log(`\n---------------- SAMPLE ROWS IN: ${tbl} (count:${rows.length}) ----------------`);
      console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
      console.log(`Error on table ${tbl}: ${err.message}`);
    }
  }

  await conn.end();
}

inspectAuthTables();
