const axios = require('axios');

const BASE = process.env.BASE_URL || 'http://localhost:5000';

function waitForServer(timeout = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function ping() {
      axios.get(`${BASE}/health`).then(() => resolve()).catch((err) => {
        if (Date.now() - start > timeout) return reject(new Error('Server did not become ready in time'));
        setTimeout(ping, 500);
      });
    })();
  });
}

describe('Auth integration (register -> login -> me)', () => {
  const email = `integration+${Date.now()}@example.com`;
  const password = 'password123';
  let token = null;

  beforeAll(async () => {
    await waitForServer(15000);
  });

  test('register should succeed', async () => {
    const res = await axios.post(`${BASE}/api/auth/register`, {
      email,
      password,
      firstName: 'Integration',
      lastName: 'Test',
    });
    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty('token');
    expect(res.data).toHaveProperty('user');
  });

  test('login should return token', async () => {
    const res = await axios.post(`${BASE}/api/auth/login`, { email, password });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('token');
    token = res.data.token;
  });

  test('/api/users/me should return the user when authorized', async () => {
    const res = await axios.get(`${BASE}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('user');
    expect(res.data.user.email).toBe(email);
  });
});
