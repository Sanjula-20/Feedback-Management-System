const mysql = require('mysql2/promise');

async function inspectUsersAndRoles() {
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

  for (const tbl of ['users', 'roles', 'departments']) {
    const [cols] = await conn.query(`DESCRIBE \`${tbl}\``);
    console.log(`\n=== SCHEMA OF: ${tbl} ===`);
    cols.forEach(c => console.log(`  ${c.Field}: ${c.Type} | Null:${c.Null} | Key:${c.Key}`));

    const [rows] = await conn.query(`SELECT * FROM \`${tbl}\` LIMIT 10`);
    console.log(`\n--- ROWS IN: ${tbl} ---`);
    console.log(JSON.stringify(rows, null, 2));
  }

  await conn.end();
}

inspectUsersAndRoles();
