import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '3D 知识图谱',
  description: '交互式 3D 知识图谱可视化平台',
  icons: {
    icon: '/favicon.ico'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  )
}
