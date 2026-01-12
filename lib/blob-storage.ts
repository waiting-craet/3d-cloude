import { put, del, list } from '@vercel/blob'

/**
 * 上传图片到 Vercel Blob
 * @param file - 文件对象或 Buffer
 * @param filename - 文件名
 * @returns 上传后的 URL
 */
export async function uploadImage(file: File | Buffer, filename: string): Promise<string> {
  try {
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true, // 添加随机后缀避免文件名冲突
    })
    
    return blob.url
  } catch (error) {
    console.error('上传图片失败:', error)
    throw new Error('上传图片失败')
  }
}

/**
 * 删除 Blob 中的文件
 * @param url - 文件的完整 URL
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    await del(url)
  } catch (error) {
    console.error('删除图片失败:', error)
    throw new Error('删除图片失败')
  }
}

/**
 * 列出所有上传的文件
 * @param prefix - 文件名前缀（可选）
 * @returns 文件列表
 */
export async function listImages(prefix?: string) {
  try {
    const { blobs } = await list({
      prefix: prefix || '',
    })
    
    return blobs
  } catch (error) {
    console.error('获取文件列表失败:', error)
    throw new Error('获取文件列表失败')
  }
}

/**
 * 上传节点的图片/图标
 * @param file - 图片文件
 * @param nodeId - 节点 ID
 * @returns 图片 URL
 */
export async function uploadNodeImage(file: File | Buffer, nodeId: string): Promise<string> {
  const filename = `nodes/${nodeId}/${Date.now()}.png`
  return uploadImage(file, filename)
}

/**
 * 上传文档的封面图
 * @param file - 图片文件
 * @param documentId - 文档 ID
 * @returns 图片 URL
 */
export async function uploadDocumentCover(file: File | Buffer, documentId: string): Promise<string> {
  const filename = `documents/${documentId}/cover.png`
  return uploadImage(file, filename)
}
