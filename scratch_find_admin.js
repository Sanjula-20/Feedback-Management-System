const mysql = require('mysql2/promise');

async function findAdmins() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root@123',
    database: 'feedback_management'
  });

  const [rows] = await conn.query(`
    SELECT u.userId, u.userNumber, u.userName, u.userMail, u.roleId, u.password, r.roleName 
    FROM users u 
    LEFT JOIN roles r ON u.roleId = r.roleId 
    WHERE u.roleId = 1 OR LOWER(r.roleName) LIKE '%admin%'
  `);

  console.log('--- ADMIN USERS IN DB ---');
  console.log(rows);

  await conn.end();
}

findAdmins();
