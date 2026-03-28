/**
 * 测试上传 API 的诊断脚本
 * 用于诊断图片上传 500 错误
 */

// 手动加载环境变量
import { readFileSync } from 'fs'
import { join } from 'path'

// 读取 .env 文件
try {
  const envPath = join(process.cwd(), '.env')
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
} catch (error) {
  console.log('⚠️ 无法读取 .env 文件')
}

async function testUploadAPI() {
  console.log('🔍 开始测试上传 API...\n')

  // 1. 检查环境变量
  console.log('1️⃣ 检查环境变量:')
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (blobToken) {
    console.log('✅ BLOB_READ_WRITE_TOKEN 已配置')
    console.log(`   Token 前缀: ${blobToken.substring(0, 20)}...`)
  } else {
    console.log('❌ BLOB_READ_WRITE_TOKEN 未配置')
    return
  }

  // 2. 测试 Vercel Blob 连接
  console.log('\n2️⃣ 测试 Vercel Blob 连接:')
  try {
    const { put } = await import('@vercel/blob')
    console.log('✅ @vercel/blob 模块加载成功')

    // 创建一个测试文件
    const testContent = 'test-upload-' + Date.now()
    const testFile = new Blob([testContent], { type: 'text/plain' })
    
    console.log('   尝试上传测试文件...')
    const result = await put(`test/${Date.now()}.txt`, testFile, {
      access: 'public',
    })
    
    console.log('✅ 上传成功!')
    console.log(`   URL: ${result.url}`)
    console.log(`   Pathname: ${result.pathname}`)
    
  } catch (error) {
    console.log('❌ 上传失败:')
    console.error(error)
  }

  console.log('\n✅ 测试完成')
}

testUploadAPI().catch(console.error)
