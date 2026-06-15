async function run() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'khoakhoa' })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.accessToken;

    // 2. Fetch course prerequisites
    const prereqsRes = await fetch('http://localhost:3000/course_prerequisites?program_id=790e104d-4bb6-433a-9ee8-5969e1dc99a6&limit=30', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await prereqsRes.json();
    console.log('API Response data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
