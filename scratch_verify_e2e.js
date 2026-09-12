const http = require('http');

function makeRequest(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function verifyE2E() {
  console.log('--- STARTING E2E SYSTEM VERIFICATION ---');

  // 1. Health check
  const health = await makeRequest('http://localhost:5000/api/health');
  console.log('[1] API Health Check:', health.status, health.body);

  // 2. Test Login API as SuperAdmin (ADMIN001)
  const loginRes = await makeRequest('http://localhost:5000/api/auth/login', 'POST', {
    username: 'ADMIN001',
    password: 'admin123'
  });
  console.log('[2] Login Attempt status:', loginRes.status);
  
  if (loginRes.body.success) {
    console.log('    ✓ Login SUCCESSFUL!');
    console.log('    User:', loginRes.body.user.userName);
    console.log('    Role:', loginRes.body.user.roleName);
    console.log('    Redirect:', loginRes.body.user.redirectUrl);
    const token = loginRes.body.token;

    // 3. Test Questions API with token
    const qRes = await makeRequest('http://localhost:5000/api/questions', 'GET', null, { Authorization: `Bearer ${token}` });
    console.log('[3] GET /api/questions status:', qRes.status, '| Questions count:', qRes.body.data?.length);

    // 4. Test Feedback Sessions API
    const sRes = await makeRequest('http://localhost:5000/api/feedback-sessions', 'GET', null, { Authorization: `Bearer ${token}` });
    console.log('[4] GET /api/feedback-sessions status:', sRes.status, '| Sessions count:', sRes.body.data?.length);

    // 5. Test Reports API
    const rRes = await makeRequest('http://localhost:5000/api/reports?reportType=Department+Summary', 'GET', null, { Authorization: `Bearer ${token}` });
    console.log('[5] GET /api/reports status:', rRes.status, '| Report items count:', rRes.body.data?.length);
  } else {
    console.log('    Login failed:', loginRes.body.message);
  }

  // 6. Test Frontend HTML server
  const feRes = await makeRequest('http://localhost:3000/');
  console.log('[6] Frontend http://localhost:3000/ status:', feRes.status, '| HTML served:', feRes.body.toString().includes('<div id="root">'));

  console.log('--- E2E SYSTEM VERIFICATION COMPLETE ---');
}

verifyE2E();
