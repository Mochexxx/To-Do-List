const { default: fetch } = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  try {
    // Test 1: Register a user
    console.log('1. Testing user registration...');
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },      body: JSON.stringify({        name: 'Test User 3',
        email: 'test3@example.com',
        password: 'password123',
        country: 'pt',
        countryName: 'Portugal',
        newsCountryCode: 'pt'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('Register response:', registerData);
    
    if (!registerResponse.ok) {
      throw new Error(`Registration failed: ${registerData.message}`);
    }
    
    const token = registerData.token;
    console.log('✅ User registered successfully');
    
    // Test 2: Create a task
    console.log('\n2. Testing task creation...');
    const taskResponse = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },      body: JSON.stringify({
        title: 'Test Task',
        description: 'This is a test task',
        priority: 'alta',
        status: 'pendente',
        estimatedDuration: '1h'
      })
    });
    
    const taskData = await taskResponse.json();
    console.log('Task response:', taskData);
    
    if (!taskResponse.ok) {
      throw new Error(`Task creation failed: ${taskData.message}`);
    }
    
    console.log('✅ Task created successfully');
    
    // Test 3: Get tasks
    console.log('\n3. Testing task retrieval...');
    const getTasksResponse = await fetch(`${API_BASE}/tasks`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    const tasks = await getTasksResponse.json();
    console.log('Tasks response:', tasks);
    
    if (!getTasksResponse.ok) {
      throw new Error(`Task retrieval failed: ${tasks.message}`);
    }
    
    console.log('✅ Tasks retrieved successfully');
    console.log(`Found ${tasks.length} tasks`);
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
  }
}

testAPI();
