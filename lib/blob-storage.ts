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
 * 删除 Blob 中的图片
 * @param url - 图片的完整 URL
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
 * 列出所有上传的图片
 * @param prefix - 文件名前缀（可选）
 * @returns 图片列表
 */
export async function listImages(prefix?: string) {
  try {
    const { blobs } = await list({
      prefix: prefix || '',
    })
    
    return blobs
  } catch (error) {
    console.error('获取图片列表失败:', error)
    throw new Error('获取图片列表失败')
  }
}

/**
 * 上传节点的缩略图
 * @param nodeId - 节点 ID
 * @param file - 图片文件
 * @returns 图片 URL
 */
export async function uploadNodeThumbnail(nodeId: string, file: File | Buffer): Promise<string> {
  const filename = `nodes/${nodeId}/thumbnail.jpg`
  return uploadImage(file, filename)
}

/**
 * 上传节点的附件图片
 * @param nodeId - 节点 ID
 * @param file - 图片文件
 * @param attachmentName - 附件名称
 * @returns 图片 URL
 */
export async function uploadNodeAttachment(
  nodeId: string,
  file: File | Buffer,
  attachmentName: string
): Promise<string> {
  const filename = `nodes/${nodeId}/attachments/${attachmentName}`
  return uploadImage(file, filename)
}

/**
 * 删除节点的所有图片
 * @param nodeId - 节点 ID
 */
export async function deleteNodeImages(nodeId: string): Promise<void> {
  try {
    const images = await listImages(`nodes/${nodeId}/`)
    
    // 批量删除所有相关图片
    await Promise.all(images.map(img => deleteImage(img.url)))
  } catch (error) {
    console.error('删除节点图片失败:', error)
    throw new Error('删除节点图片失败')
  }
}
