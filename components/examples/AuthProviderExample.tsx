'use client'

import AuthProvider, { useAuthStatus, withAuth } from '../AuthProvider'
import EnhancedNavbar from '../EnhancedNavbar'

// Example of a protected component
const ProtectedDashboard = withAuth(() => {
  const { user } = useAuthStatus()
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">用户仪表板</h1>
      <p>欢迎, {user?.username}!</p>
      <p>这是一个受保护的页面，只有登录用户才能访问。</p>
    </div>
  )
})

// Example of using auth status in a component
function UserGreeting() {
  const { isLoggedIn, user, isInitialized } = useAuthStatus()

  if (!isInitialized) {
    return <div>正在加载...</div>
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      {isLoggedIn ? (
        <p>你好, {user?.username}! 欢迎回来。</p>
      ) : (
        <p>你好，访客! 请登录以获得完整体验。</p>
      )}
    </div>
  )
}

// Main app example with AuthProvider
export default function AuthProviderExample() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <EnhancedNavbar />
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="space-y-8">
            <UserGreeting />
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">公开内容</h2>
              <p>这部分内容对所有用户可见，无需登录。</p>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold p-6 border-b">受保护的内容</h2>
              <ProtectedDashboard />
            </div>
          </div>
        </main>
      </div>
    </AuthProvider>
  )
}

// Usage in Next.js app layout or page:
/*
// app/layout.tsx or app/page.tsx
import AuthProvider from '@/components/AuthProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
*/