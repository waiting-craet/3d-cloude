// 测试注册功能
async function testRegister() {
  const testUser = {
    username: 'testuser123',
    password: 'test123456',
  }

  console.log('Testing registration with:', testUser)

  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password,
        email: `${testUser.username}@local.system`,
      }),
    })

    const data = await response.json()
    console.log('Response status:', response.status)
    console.log('Response data:', data)

    if (data.success) {
      console.log('✅ Registration successful!')
    } else {
      console.log('❌ Registration failed:', data.error)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testRegister()
