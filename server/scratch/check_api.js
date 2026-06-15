async function run() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'khoakhoa' })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.statusText}`);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.accessToken;
    console.log('Login successful, token length:', token ? token.length : 0);

    // 2. Fetch curriculum courses
    const coursesRes = await fetch('http://localhost:3000/curriculum_courses?program_id=790e104d-4bb6-433a-9ee8-5969e1dc99a6&limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('API Response status:', coursesRes.status);
    const data = await coursesRes.json();
    console.log('API Response data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
