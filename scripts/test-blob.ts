import { put, list } from '@vercel/blob'

async function testBlobConnection() {
  console.log('🔍 测试 Vercel Blob 连接...\n')
  
  try {
    // 测试上传一个简单的文本文件
    console.log('📤 上传测试文件...')
    const testContent = `测试文件 - ${new Date().toISOString()}`
    const blob = await put('test/connection-test.txt', testContent, {
      access: 'public',
    })
    
    console.log('✅ 上传成功!')
    console.log('   URL:', blob.url)
    console.log('   路径:', blob.pathname)
    console.log('   大小:', blob.size, 'bytes')
    console.log('')
    
    // 测试列出文件
    console.log('📋 列出 Blob 中的文件...')
    const { blobs } = await list({
      limit: 10,
    })
    
    console.log(`✅ 找到 ${blobs.length} 个文件:`)
    blobs.forEach((b, index) => {
      console.log(`   ${index + 1}. ${b.pathname}`)
      console.log(`      URL: ${b.url}`)
      console.log(`      大小: ${b.size} bytes`)
      console.log(`      上传时间: ${b.uploadedAt}`)
      console.log('')
    })
    
    console.log('🎉 Vercel Blob 连接测试成功!')
    
  } catch (error) {
    console.error('❌ Vercel Blob 连接测试失败:')
    console.error(error)
    
    if (error instanceof Error) {
      if (error.message.includes('BLOB_READ_WRITE_TOKEN')) {
        console.error('\n💡 提示: 请确保设置了 BLOB_READ_WRITE_TOKEN 环境变量')
        console.error('   在 Vercel 控制台中，这个变量应该已经自动配置')
        console.error('   本地开发需要在 .env 文件中添加此变量')
      }
    }
    
    process.exit(1)
  }
}

testBlobConnection()
