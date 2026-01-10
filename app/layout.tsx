import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '3D 知识图谱',
  description: '交互式 3D 知识图谱可视化平台',
}

export const runtime = 'edge'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
