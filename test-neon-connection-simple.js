// 测试Neon数据库连接
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log('正在连接Neon数据库...');
    const client = await pool.connect();
    console.log('✓ 连接成功！');
    
    // 测试查询
    const result = await client.query('SELECT NOW()');
    console.log('当前时间:', result.rows[0].now);
    
    client.release();
    await pool.end();
    console.log('\n数据库已就绪！');
  } catch (error) {
    console.error('连接失败:', error.message);
    process.exit(1);
  }
}

testConnection();
