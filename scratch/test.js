async function test() {
  try {
    const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
test();
