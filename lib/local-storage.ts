import { writeFile, unlink, mkdir, readdir, rm } from 'fs/promises'
import { existsSync } from 'fs'
import { join, resolve } from 'path'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

function getAbsolutePath(relativePath: string): string {
  return join(UPLOAD_DIR, relativePath)
}

export function urlToFilePath(url: string): string | null {
  try {
    const match = url.match(/\/uploads\/(.+)$/)
    if (!match) return null
    return getAbsolutePath(match[1])
  } catch {
    return null
  }
}

export async function saveFile(relativePath: string, data: Buffer): Promise<string> {
  const fullPath = getAbsolutePath(relativePath)
  const dir = fullPath.substring(0, fullPath.lastIndexOf('/'))
  await mkdir(dir, { recursive: true })
  await writeFile(fullPath, data)
  return `/uploads/${relativePath}`
}

export async function deleteFile(url: string): Promise<void> {
  const filePath = urlToFilePath(url)
  if (filePath && existsSync(filePath)) {
    await unlink(filePath)
  }
}

export async function deleteDirectory(relativePath: string): Promise<void> {
  const dirPath = getAbsolutePath(relativePath)
  if (existsSync(dirPath)) {
    await rm(dirPath, { recursive: true, force: true })
  }
}

export async function deleteFiles(urls: string[]): Promise<number> {
  let count = 0
  for (const url of urls) {
    try {
      await deleteFile(url)
      count++
    } catch {
      // skip failed deletions
    }
  }
  return count
}
