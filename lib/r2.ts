// Cloudflare R2 客户端配置
// 所有密钥从环境变量读取，在 Cloudflare Pages 控制台配置

export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
}

export function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucketName = process.env.R2_BUCKET_NAME

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('R2 配置不完整，请在 Cloudflare Pages 控制台设置环境变量')
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
  }
}

// R2 上传文件的辅助函数
export async function uploadToR2(
  file: File,
  key: string
): Promise<string> {
  const config = getR2Config()
  
  // 使用 Cloudflare Workers 的 R2 绑定或 S3 兼容 API
  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`
  
  // 这里需要实现 S3 兼容的签名上传
  // 在实际使用中，建议通过 API Route 处理上传
  
  return `${endpoint}/${config.bucketName}/${key}`
}
