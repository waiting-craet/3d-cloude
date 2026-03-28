import { saveFile, deleteFile, deleteDirectory } from './local-storage'

export async function uploadImage(file: File | Buffer, filename: string): Promise<string> {
  const buffer = file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer())
  return saveFile(filename, buffer)
}

export async function deleteImage(url: string): Promise<void> {
  await deleteFile(url)
}

export async function listImages(_prefix?: string) {
  return []
}

export async function uploadNodeThumbnail(nodeId: string, file: File | Buffer): Promise<string> {
  const filename = `nodes/${nodeId}/thumbnail.jpg`
  return uploadImage(file, filename)
}

export async function uploadNodeAttachment(
  nodeId: string,
  file: File | Buffer,
  attachmentName: string
): Promise<string> {
  const filename = `nodes/${nodeId}/attachments/${attachmentName}`
  return uploadImage(file, filename)
}

export async function deleteNodeImages(nodeId: string): Promise<void> {
  await deleteDirectory(`nodes/${nodeId}`)
}
