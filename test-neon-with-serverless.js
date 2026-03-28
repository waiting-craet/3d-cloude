// 使用@neondatabase/serverless测试连接
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function testConnection() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');
    console.log('正在连接Neon数据库...');
    const result = await sql`SELECT NOW() as now`;
    console.log('✓ 连接成功！');
    console.log('当前时间:', result[0].now);
    console.log('\n数据库已就绪！');
  } catch (error) {
    console.error('连接失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

testConnection();
