const mysql = require('mysql2/promise');

async function test() {
  const passes = ['', 'root', 'password', '123456', 'admin', 'mysql', 'Root@123'];
  for (const p of passes) {
    try {
      const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: p,
        database: 'feedback_management'
      });
      console.log(`FOUND WORKING PASSWORD: "${p}"`);
      await conn.end();
      return p;
    } catch (e) {
      console.log(`Failed "${p}": ${e.message}`);
    }
  }
}

test();
