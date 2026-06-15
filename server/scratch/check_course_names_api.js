async function run() {
  try {
    const loginRes = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'khoakhoa' })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.accessToken;

    const coursesRes = await fetch('http://localhost:3000/curriculum_courses?program_id=790e104d-4bb6-433a-9ee8-5969e1dc99a6&limit=500', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await coursesRes.json();
    const names = data.map(c => ({ code: c.course_code, name: c.course_name }));
    console.log('ALL API COURSE NAMES:');
    console.log(names.slice(0, 30));
    
    const badNames = data.filter(c => c.course_name === 'Bắt buộc' || c.course_name === 'Thể chất');
    console.log('BAD NAMES COUNT:', badNames.length);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
