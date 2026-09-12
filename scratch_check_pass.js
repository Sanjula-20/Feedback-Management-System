const bcrypt = require('bcryptjs');

async function checkPass() {
  const hash = '$2a$10$SX.OysPQrwypqvWAXzkcOe..6Kr6YB7sI9ERMCZ5yEHlYngtGWGwi';
  const passwordsToTest = ['admin123', 'admin', 'password', '123456', 'superadmin', 'Superadmin@123', 'ADMIN001', 'root'];

  for (const p of passwordsToTest) {
    const match = await bcrypt.compare(p, hash);
    if (match) {
      console.log(`FOUND WORKING PASSWORD FOR ADMIN001: "${p}"`);
      return p;
    }
  }
  console.log('No standard password matched the hash directly.');
}

checkPass();
